"""
Research Planner Module (Stages 1 & 2).
Analyzes meeting context, calculates freshness window, and uses Bifrost
to formulate objective-specific, categorized research queries.
"""

from datetime import datetime, timedelta
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from ai_engine.integrations.bifrost_client import BifrostClient
from ai_engine.schemas import MeetingRequest, ResearchPlan, SearchQuery

logger = logging.getLogger("ai_engine.planner")

PROMPT_FILE = Path(__file__).resolve().parent / "prompts" / "planning.txt"


class ResearchPlanner:
    """Plans research queries tailored to the meeting objective."""

    def __init__(self, bifrost_client: Optional[BifrostClient] = None):
        self.bifrost = bifrost_client or BifrostClient()
        self._load_prompt_template()

    def _load_prompt_template(self):
        try:
            with open(PROMPT_FILE, "r", encoding="utf-8") as f:
                self.prompt_template = f.read()
        except Exception as e:
            logger.error(f"Error reading planning prompt template: {e}")
            self.prompt_template = (
                "Generate categorized search queries for {company} regarding objective: {objective}. "
                "Timeframe: {window_start} to {cutoff_date}."
            )

    @staticmethod
    def calculate_time_window(meeting_date_str: str, window_days: int = 30) -> Tuple[datetime, datetime]:
        """
        Calculates (window_start, cutoff_date) based on the meeting date.
        """
        clean_str = meeting_date_str.strip()
        if "T" in clean_str:
            cutoff_date = datetime.fromisoformat(clean_str.replace("Z", "+00:00"))
        else:
            cutoff_date = datetime.strptime(clean_str, "%Y-%m-%d")

        window_start = cutoff_date - timedelta(days=window_days)
        return window_start, cutoff_date

    def plan_research(self, request: MeetingRequest) -> ResearchPlan:
        """
        Generate categorized search queries using Bifrost.
        If Bifrost is unavailable or fails, returns deterministic, objective-aligned queries.
        """
        window_start, cutoff_date = self.calculate_time_window(request.meeting_date)
        window_start_str = window_start.strftime("%Y-%m-%d")
        cutoff_date_str = cutoff_date.strftime("%Y-%m-%d")

        prompt = self.prompt_template.format(
            company=request.company,
            website=request.website or "N/A",
            meeting_date=request.meeting_date,
            window_start=window_start_str,
            cutoff_date=cutoff_date_str,
            meeting_type=request.meeting_type,
            objective=request.objective,
            additional_context=request.additional_context or "None provided",
        )

        messages = [
            {"role": "system", "content": "You are MeetIQ Research Planner. Output strictly valid JSON."},
            {"role": "user", "content": prompt},
        ]

        try:
            plan = self.bifrost.generate_structured(messages=messages, schema=ResearchPlan)
            plan.company = request.company
            plan.objective = request.objective
            if plan.queries:
                return plan
        except Exception as e:
            logger.warning(f"Bifrost query planning call failed: {e}. Falling back to heuristic planning.")

        # Heuristic fallback guaranteed to be objective-tailored
        return self._generate_heuristic_plan(request, window_start_str, cutoff_date_str)

    def _generate_heuristic_plan(
        self,
        request: MeetingRequest,
        window_start_str: str,
        cutoff_date_str: str,
    ) -> ResearchPlan:
        """
        Produces high-yield queries tailored to company and specific objective.
        """
        company = request.company
        obj = request.objective.lower()

        queries: List[SearchQuery] = []

        # Product / Technical Launch
        if "ai" in obj or "tech" in obj or "product" in obj or "platform" in obj:
            queries.append(
                SearchQuery(
                    category="Product Launches",
                    query=f'"{company}" AI product launch announcement {cutoff_date_str[:4]}',
                    reasoning="Detect recent AI capabilities and platform updates relevant to objective",
                )
            )
        else:
            queries.append(
                SearchQuery(
                    category="Product Launches",
                    query=f'"{company}" product launch release new {cutoff_date_str[:4]}',
                    reasoning="Uncover recent core product milestones",
                )
            )

        # Strategic Partnerships / Deals
        queries.append(
            SearchQuery(
                category="Partnerships & Customers",
                query=f'"{company}" partnership agreement collaboration deal',
                reasoning=f"Investigate existing partner ecosystem related to {request.meeting_type}",
            )
        )

        # Executive Leadership & Strategy
        queries.append(
            SearchQuery(
                category="Leadership & Strategy",
                query=f'"{company}" executive leadership strategy priorities',
                reasoning="Identify executive direction and strategic focus areas",
            )
        )

        # Objective-specific query
        queries.append(
            SearchQuery(
                category="Meeting Focus",
                query=f'"{company}" {request.objective}',
                reasoning="Direct search alignment with the stated meeting objective",
            )
        )

        # Market & Regulatory
        queries.append(
            SearchQuery(
                category="Market & Regulation",
                query=f'"{company}" market competition regulation challenges',
                reasoning="Assess headwinds, market risks, or regulatory factors",
            )
        )

        return ResearchPlan(
            company=request.company,
            objective=request.objective,
            queries=queries,
        )

