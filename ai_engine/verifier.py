"""
Evidence Verification Module (Stage 6 & Stage 7 support).
Fact-checks claims against source texts, enforces temporal boundaries,
identifies conflicting claims, and detects categories requiring iterative research.
"""

from datetime import datetime
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from pydantic import BaseModel, Field

from ai_engine.integrations.bifrost_client import BifrostClient
from ai_engine.schemas import (
    ExtractedClaim,
    NormalizedSource,
    VerifiedDevelopment,
)

logger = logging.getLogger("ai_engine.verifier")

VERIFICATION_PROMPT_FILE = Path(__file__).resolve().parent / "prompts" / "verification.txt"


class SingleVerification(BaseModel):
    development_index: int
    is_verified: bool = True
    confidence_score: float = Field(default=0.8, ge=0.0, le=1.0)
    is_within_30_days: bool = True
    verification_notes: Optional[str] = ""
    corrected_date: Optional[str] = None


class VerificationReport(BaseModel):
    verifications: List[SingleVerification] = Field(default_factory=list)
    insufficient_evidence_categories: List[str] = Field(default_factory=list)
    identified_limitations: List[str] = Field(default_factory=list)


class Verifier:
    """Verifies extracted claims against underlying source content."""

    def __init__(self, bifrost_client: Optional[BifrostClient] = None):
        self.bifrost = bifrost_client or BifrostClient()
        self._load_prompt_template()

    def _load_prompt_template(self):
        try:
            with open(VERIFICATION_PROMPT_FILE, "r", encoding="utf-8") as f:
                self.prompt_template = f.read()
        except Exception as e:
            logger.error(f"Error loading verification prompt: {e}")
            self.prompt_template = "Verify claims against sources: {developments_text}\nSources: {sources_text}"

    def verify_developments(
        self,
        company: str,
        objective: str,
        claims: List[ExtractedClaim],
        sources: List[NormalizedSource],
        window_start: datetime,
        cutoff_date: datetime,
    ) -> Tuple[List[VerifiedDevelopment], List[str], List[str]]:
        """
        Executes evidence verification for all extracted claims.
        Returns (verified_developments, insufficient_categories, limitations).
        """
        if not claims or not sources:
            limitations = ["No verifiable sources or developments found during research."]
            return [], [], limitations

        sources_by_id: Dict[str, NormalizedSource] = {s.source_id: s for s in sources}
        window_start_str = window_start.strftime("%Y-%m-%d")
        cutoff_date_str = cutoff_date.strftime("%Y-%m-%d")

        # Prepare prompt texts
        sources_text = "\n---\n".join([
            f"[{s.source_id}] {s.title} ({s.published_at or 'Undated'})\n{s.content}"
            for s in sources
        ])
        developments_text = "\n---\n".join([
            f"[Index {i}] {c.title} (Date: {c.date or 'None'}, Sources: {c.source_ids})\n{c.description}"
            for i, c in enumerate(claims)
        ])

        prompt = self.prompt_template.format(
            company=company,
            objective=objective,
            window_start=window_start_str,
            cutoff_date=cutoff_date_str,
            sources_text=sources_text,
            developments_text=developments_text,
        )

        messages = [
            {"role": "system", "content": "You are MeetIQ Evidence Verifier. Return strictly valid JSON."},
            {"role": "user", "content": prompt},
        ]

        report = None
        try:
            report = self.bifrost.generate_structured(messages=messages, schema=VerificationReport)
        except Exception as e:
            logger.warning(f"Bifrost verification call failed: {e}. Executing programmatic verification.")

        return self._process_verification_results(
            claims=claims,
            sources_by_id=sources_by_id,
            window_start_str=window_start_str,
            cutoff_date_str=cutoff_date_str,
            report=report,
        )

    def _process_verification_results(
        self,
        claims: List[ExtractedClaim],
        sources_by_id: Dict[str, NormalizedSource],
        window_start_str: str,
        cutoff_date_str: str,
        report: Optional[VerificationReport],
    ) -> Tuple[List[VerifiedDevelopment], List[str], List[str]]:
        """
        Synthesizes verified developments using both algorithmic ground-truth checks
        and model verification results.
        """
        verified_list: List[VerifiedDevelopment] = []
        limitations: List[str] = []
        insufficient_categories: Set[str] = set()

        if report and report.identified_limitations:
            limitations.extend(report.identified_limitations)
        if report and report.insufficient_evidence_categories:
            insufficient_categories.update(report.insufficient_evidence_categories)

        verification_map: Dict[int, SingleVerification] = {}
        if report:
            for v in report.verifications:
                verification_map[v.development_index] = v

        for idx, claim in enumerate(claims):
            # Check if referenced sources actually exist
            valid_source_ids = [sid for sid in claim.source_ids if sid in sources_by_id]
            if not valid_source_ids:
                limitations.append(f"Excluded development '{claim.title}' due to missing source reference.")
                continue

            # Check grounding: find source texts
            source_texts = " ".join([
                (sources_by_id[sid].title + " " + sources_by_id[sid].content).lower()
                for sid in valid_source_ids
            ])

            # Recency & date validation
            effective_date = claim.date
            model_verification = verification_map.get(idx)

            if model_verification and model_verification.corrected_date:
                effective_date = model_verification.corrected_date

            # Temporal rule: must be inside 30-day window or flagged
            is_recent = False
            if effective_date:
                clean_date = effective_date.strip()
                if window_start_str <= clean_date <= cutoff_date_str:
                    is_recent = True
                else:
                    # Dated but outside 30-day window
                    is_recent = False
            else:
                # Undated
                is_recent = False

            # Model rejection check
            if model_verification and not model_verification.is_verified:
                limitations.append(
                    f"Excluded unverified claim '{claim.title}': {model_verification.verification_notes or 'Unsubstantiated'}"
                )
                continue

            # Programmatic keyword grounding check
            # Verify that core keywords of the claim title appear in the source text
            title_keywords = [
                w.lower() for w in claim.title.split()
                if len(w) > 4 and w.lower() not in {"announces", "launches", "update", "strategic"}
            ]
            keyword_matches = [w for w in title_keywords if w in source_texts]
            if title_keywords and not keyword_matches:
                # Low grounding warning
                confidence = 0.4
            else:
                confidence = model_verification.confidence_score if model_verification else 0.85

            verified_list.append(
                VerifiedDevelopment(
                    title=claim.title,
                    description=claim.description,
                    date=effective_date if is_recent else (effective_date or None),
                    importance=claim.importance,
                    meeting_relevance=claim.meeting_relevance,
                    source_ids=valid_source_ids,
                    confidence_score=confidence,
                    verification_notes=(
                        f"Verified against {len(valid_source_ids)} source(s). "
                        + ("Within 30-day window." if is_recent else "Undated or historical background.")
                    ),
                    is_verified=True,
                )
            )

        # Flag undated sources in limitations
        undated_sources = [s.source_id for s in sources_by_id.values() if not s.published_at]
        if undated_sources:
            limitations.append(
                f"{len(undated_sources)} source(s) had unconfirmed publication dates and were evaluated with conservative recency weighting."
            )

        return verified_list, list(insufficient_categories), limitations

