"""
Researcher Module (Stages 3, 4 & 5).
Executes targeted Tavily searches, applies 30-day freshness filtering,
and extracts concrete factual claims with source grounding.
"""

from datetime import datetime
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from pydantic import BaseModel, Field

from ai_engine.config import config
from ai_engine.integrations.bifrost_client import BifrostClient
from ai_engine.integrations.tavily_client import TavilyClient
from ai_engine.schemas import (
    ExtractedClaim,
    MeetingRequest,
    NormalizedSource,
    ResearchPlan,
)

logger = logging.getLogger("ai_engine.researcher")

EXTRACTION_PROMPT_FILE = Path(__file__).resolve().parent / "prompts" / "extraction.txt"


class ExtractionResponse(BaseModel):
    developments: List[ExtractedClaim] = Field(default_factory=list)


class Researcher:
    """Coordinates search execution, recency filtering, and claim extraction."""

    def __init__(
        self,
        tavily_client: Optional[TavilyClient] = None,
        bifrost_client: Optional[BifrostClient] = None,
    ):
        self.tavily = tavily_client or TavilyClient()
        self.bifrost = bifrost_client or BifrostClient()
        self._load_extraction_prompt()

    def _load_extraction_prompt(self):
        try:
            with open(EXTRACTION_PROMPT_FILE, "r", encoding="utf-8") as f:
                self.prompt_template = f.read()
        except Exception as e:
            logger.error(f"Error loading extraction prompt: {e}")
            self.prompt_template = (
                "Extract developments for {company} regarding {objective} from:\n{sources_text}"
            )

    def execute_search_plan(
        self,
        plan: ResearchPlan,
        window_start: datetime,
        cutoff_date: datetime,
    ) -> List[NormalizedSource]:
        """
        Executes targeted searches across planned queries, deduplicating URLs.
        """
        seen_urls: Set[str] = set()
        all_sources: List[NormalizedSource] = []
        source_counter = 1

        for query_item in plan.queries:
            try:
                sources = self.tavily.search_and_normalize(
                    query=query_item.query,
                    id_counter_start=source_counter,
                    existing_urls=seen_urls,
                    max_results=config.max_search_results_per_query,
                    topic="news",
                    days=config.freshness_window_days,
                )
                source_counter += len(sources)
                all_sources.extend(sources)
            except Exception as e:
                logger.warning(f"Search failed for query '{query_item.query}': {e}")

        # Apply Stage 4 freshness evaluation
        self.evaluate_source_freshness(all_sources, window_start, cutoff_date)
        return all_sources

    @staticmethod
    def evaluate_source_freshness(
        sources: List[NormalizedSource],
        window_start: datetime,
        cutoff_date: datetime,
    ):
        """
        Evaluates publication dates against the 30-day window.
        Distinguishes verified recent sources from undated or outdated sources.
        """
        window_start_str = window_start.strftime("%Y-%m-%d")
        cutoff_date_str = cutoff_date.strftime("%Y-%m-%d")

        for source in sources:
            if not source.published_at:
                source.is_date_verified = False
                source.is_within_30_days = False
                continue

            # Check if publication date falls inside the 30-day range
            pub_date = source.published_at.strip()
            source.is_date_verified = True
            if window_start_str <= pub_date <= cutoff_date_str:
                source.is_within_30_days = True
            else:
                source.is_within_30_days = False

    def extract_claims(
        self,
        request: MeetingRequest,
        sources: List[NormalizedSource],
        window_start: datetime,
        cutoff_date: datetime,
    ) -> List[ExtractedClaim]:
        """
        Extracts factual developments from retrieved sources using Bifrost.
        """
        if not sources:
            return []

        # Prepare source catalog for prompt
        sources_text_blocks = []
        for s in sources:
            date_label = s.published_at if s.published_at else "Undated"
            sources_text_blocks.append(
                f"[{s.source_id}] Title: {s.title}\n"
                f"URL: {s.url}\n"
                f"Date: {date_label}\n"
                f"Excerpt: {s.content}\n"
            )
        sources_text = "\n---\n".join(sources_text_blocks)

        prompt = self.prompt_template.format(
            company=request.company,
            objective=request.objective,
            meeting_type=request.meeting_type,
            window_start=window_start.strftime("%Y-%m-%d"),
            cutoff_date=cutoff_date.strftime("%Y-%m-%d"),
            sources_text=sources_text,
        )

        messages = [
            {"role": "system", "content": "You are MeetIQ Claim Extraction Specialist. Return strictly valid JSON."},
            {"role": "user", "content": prompt},
        ]

        try:
            extraction = self.bifrost.generate_structured(messages=messages, schema=ExtractionResponse)
            # Filter and validate that extracted source_ids match actual sources
            valid_source_ids = {s.source_id for s in sources}
            validated_claims: List[ExtractedClaim] = []
            for claim in extraction.developments:
                claim.source_ids = [sid for sid in claim.source_ids if sid in valid_source_ids]
                if claim.source_ids:
                    validated_claims.append(claim)
            return validated_claims
        except Exception as e:
            logger.warning(f"Bifrost claim extraction call failed: {e}. Falling back to rule-based extraction.")

        return self._heuristic_extraction(request, sources)

    def _heuristic_extraction(
        self,
        request: MeetingRequest,
        sources: List[NormalizedSource],
    ) -> List[ExtractedClaim]:
        """
        Heuristic fallback claim extractor when Bifrost is offline or returns invalid response.
        Extracts directly from source titles and content excerpts.
        """
        claims: List[ExtractedClaim] = []
        for s in sources:
            if not s.content and not s.title:
                continue
            desc = s.content[:300] if s.content else s.title
            claims.append(
                ExtractedClaim(
                    title=s.title,
                    description=desc,
                    date=s.published_at,
                    importance="high" if s.is_within_30_days else "medium",
                    meeting_relevance=f"Relevant to {request.meeting_type} and {request.objective}",
                    category="Recent Coverage",
                    source_ids=[s.source_id],
                )
            )
        return claims

