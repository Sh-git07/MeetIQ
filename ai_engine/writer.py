"""
Writer Module (Stage 8).
Synthesizes verified research into a strategic executive briefing,
strictly conforming to the mandatory Pydantic ExecutiveBriefing schema.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import ValidationError

from ai_engine.integrations.bifrost_client import BifrostClient
from ai_engine.schemas import (
    ExecutiveBriefing,
    MeetingRequest,
    NormalizedSource,
    OpportunityItem,
    RecentDevelopment,
    RiskItem,
    SourceItem,
    VerifiedDevelopment,
)

logger = logging.getLogger("ai_engine.writer")

BRIEFING_PROMPT_FILE = Path(__file__).resolve().parent / "prompts" / "briefing.txt"


class BriefingWriter:
    """Generates the final executive briefing document."""

    def __init__(self, bifrost_client: Optional[BifrostClient] = None):
        self.bifrost = bifrost_client or BifrostClient()
        self._load_prompt_template()

    def _load_prompt_template(self):
        try:
            with open(BRIEFING_PROMPT_FILE, "r", encoding="utf-8") as f:
                self.prompt_template = f.read()
        except Exception as e:
            logger.error(f"Error loading briefing prompt: {e}")
            self.prompt_template = (
                "Create executive briefing for {company} regarding objective: {objective}."
            )

    def write_briefing(
        self,
        request: MeetingRequest,
        verified_developments: List[VerifiedDevelopment],
        sources: List[NormalizedSource],
        window_start_str: str,
        cutoff_date_str: str,
        limitations: List[str],
    ) -> ExecutiveBriefing:
        """
        Synthesizes the briefing via Bifrost, falling back gracefully to
        deterministic generation if LLM is unavailable.
        """
        sources_dict: Dict[str, NormalizedSource] = {s.source_id: s for s in sources}

        # Prepare verified developments and source catalog representation
        verified_data_blocks = []
        for d in verified_developments:
            verified_data_blocks.append(
                f"- Title: {d.title}\n"
                f"  Description: {d.description}\n"
                f"  Date: {d.date or 'Undated'}\n"
                f"  Importance: {d.importance}\n"
                f"  Relevance: {d.meeting_relevance}\n"
                f"  Sources: {', '.join(d.source_ids)}"
            )

        sources_blocks = []
        for s in sources:
            sources_blocks.append(
                f"- [{s.source_id}] {s.title} | {s.publisher or 'Domain'} | URL: {s.url} | Published: {s.published_at or 'Undated'}"
            )

        combined_evidence = (
            "DEVELOPMENTS:\n" + ("\n".join(verified_data_blocks) if verified_data_blocks else "None verified.") +
            "\n\nSOURCES CATALOG:\n" + ("\n".join(sources_blocks) if sources_blocks else "No sources available.")
        )

        limitations_text = "\n".join(f"- {lim}" for lim in limitations) if limitations else "None identified."

        prompt = self.prompt_template.format(
            company=request.company,
            website=request.website or "N/A",
            meeting_date=request.meeting_date,
            meeting_type=request.meeting_type,
            objective=request.objective,
            additional_context=request.additional_context or "None",
            window_start=window_start_str,
            cutoff_date=cutoff_date_str,
            verified_data_text=combined_evidence,
            limitations_text=limitations_text,
        )

        messages = [
            {"role": "system", "content": "You are MeetIQ Executive Briefing Writer. Return strictly valid JSON."},
            {"role": "user", "content": prompt},
        ]

        try:
            briefing = self.bifrost.generate_structured(messages=messages, schema=ExecutiveBriefing)
            # Re-ensure company matches and all source references exist
            briefing.company = request.company
            return self._sanitize_briefing(briefing, sources_dict, limitations)
        except Exception as e:
            logger.warning(f"Bifrost briefing generation failed: {e}. Generating deterministic briefing.")

        return self._generate_fallback_briefing(
            request=request,
            verified_developments=verified_developments,
            sources=sources,
            limitations=limitations,
        )

    def _sanitize_briefing(
        self,
        briefing: ExecutiveBriefing,
        sources_dict: Dict[str, NormalizedSource],
        limitations: List[str],
    ) -> ExecutiveBriefing:
        """
        Ensures strict relational integrity:
        - All cited sources exist in the final sources array.
        - Appends any system-identified limitations.
        """
        # Ensure sources array has valid SourceItem models
        existing_source_ids = {s.source_id for s in briefing.sources}

        # If a development cited a source from sources_dict that wasn't in briefing.sources, add it
        all_referenced_sids = set()
        for dev in briefing.recent_developments:
            all_referenced_sids.update(dev.source_ids)
        for opp in briefing.opportunities:
            all_referenced_sids.update(opp.source_ids)
        for risk in briefing.risks:
            all_referenced_sids.update(risk.source_ids)

        for sid in all_referenced_sids:
            if sid not in existing_source_ids and sid in sources_dict:
                ns = sources_dict[sid]
                briefing.sources.append(
                    SourceItem(
                        source_id=ns.source_id,
                        title=ns.title,
                        url=ns.url,
                        publisher=ns.publisher,
                        published_at=ns.published_at,
                    )
                )

        # Merge limitations
        combined_limitations = list(dict.fromkeys(briefing.research_limitations + limitations))
        briefing.research_limitations = combined_limitations

        return briefing

    def _generate_fallback_briefing(
        self,
        request: MeetingRequest,
        verified_developments: List[VerifiedDevelopment],
        sources: List[NormalizedSource],
        limitations: List[str],
    ) -> ExecutiveBriefing:
        """
        Deterministic, schema-compliant fallback briefing synthesized from extracted evidence.
        Guarantees zero crashes even during network outages.
        """
        # Convert sources to SourceItem
        sources_list = [
            SourceItem(
                source_id=s.source_id,
                title=s.title,
                url=s.url,
                publisher=s.publisher,
                published_at=s.published_at,
            )
            for s in sources
        ]

        # Convert verified developments to RecentDevelopment
        recent_devs = [
            RecentDevelopment(
                title=d.title,
                description=d.description,
                date=d.date,
                importance=d.importance,
                meeting_relevance=d.meeting_relevance,
                source_ids=d.source_ids,
            )
            for d in verified_developments
        ]

        if recent_devs:
            summary = (
                f"Executive briefing for upcoming {request.meeting_type} meeting with {request.company}. "
                f"Identified {len(recent_devs)} verified development(s) from public signals within the 30-day "
                f"window, analyzed specifically for the objective: '{request.objective}'."
            )
        else:
            summary = (
                f"Executive briefing for {request.company} ({request.meeting_type}). "
                f"Public information within the 30-day window was limited. "
                f"Analysis focused on objective: '{request.objective}'."
            )

        # Generate opportunities from developments if present
        opportunities: List[OpportunityItem] = []
        risks: List[RiskItem] = []

        if recent_devs:
            primary_dev = recent_devs[0]
            opportunities.append(
                OpportunityItem(
                    title=f"Leverage {primary_dev.title[:50]} for Joint Value",
                    description=f"Align on joint strategic priorities leveraging recent updates in {primary_dev.title}.",
                    source_ids=primary_dev.source_ids,
                )
            )
            risks.append(
                RiskItem(
                    title="Execution and Strategic Alignment Risk",
                    description=f"Risk of strategic misalignment or shifting roadmap priorities around {request.objective}.",
                    source_ids=primary_dev.source_ids,
                )
            )
        else:
            opportunities.append(
                OpportunityItem(
                    title="Exploratory Discovery",
                    description=f"Conduct first-principles discovery into {request.company}'s current initiatives relating to {request.objective}.",
                    source_ids=[],
                )
            )
            risks.append(
                RiskItem(
                    title="Information Asymmetry",
                    description="Limited recent public disclosures require validating company priorities directly in the meeting.",
                    source_ids=[],
                )
            )

        questions = [
            f"How do {request.company}'s current initiatives align with our focus on {request.objective}?",
            f"What are the immediate milestones your leadership team is prioritizing for {request.meeting_type.lower()} engagements?",
            f"What key dependencies or governance criteria must be satisfied for a successful partnership?",
        ]

        return ExecutiveBriefing(
            company=request.company,
            executive_summary=summary,
            recent_developments=recent_devs,
            opportunities=opportunities,
            risks=risks,
            questions=questions,
            sources=sources_list,
            research_limitations=limitations,
        )

