"""
Orchestrator Module for MeetIQ AI Engine.
Provides the mandatory public entrypoint run_research() coordinating
the 8-stage research, verification, and synthesis pipeline.
"""

from datetime import datetime
import logging
from typing import Any, Callable, Dict, List, Optional
from pydantic import ValidationError

from ai_engine.config import config
from ai_engine.integrations.bifrost_client import BifrostClient
from ai_engine.integrations.tavily_client import TavilyClient
from ai_engine.planner import ResearchPlanner
from ai_engine.researcher import Researcher
from ai_engine.schemas import (
    ExecutiveBriefing,
    ExtractedClaim,
    MeetingRequest,
    NormalizedSource,
    ResearchPlan,
    SearchQuery,
    VerifiedDevelopment,
)
from ai_engine.verifier import Verifier
from ai_engine.writer import BriefingWriter

logger = logging.getLogger("ai_engine.orchestrator")


def _safe_progress(
    callback: Optional[Callable[[Dict[str, Any]], None]],
    stage: str,
    message: str,
    progress: int,
    data: Optional[Dict[str, Any]] = None,
):
    """Safely invokes the progress callback without ever crashing the engine."""
    if callback and callable(callback):
        try:
            event = {
                "stage": stage,
                "message": message,
                "progress": progress,
            }
            if data:
                event["data"] = data
            callback(event)
        except Exception as e:
            logger.warning(f"Ignored error in user progress callback: {e}")


def run_research(request: dict, progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None) -> dict:
    """
    Run the complete MeetIQ research workflow.

    Args:
        request: Meeting information dictionary.
        progress_callback: Optional callable for research progress updates.

    Returns:
        Validated executive briefing as a Python dictionary conforming to
        the mandatory ExecutiveBriefing schema.
    """
    try:
        # ---------------------------------------------------------
        # Stage 1 – Meeting context analysis
        # ---------------------------------------------------------
        _safe_progress(progress_callback, "planning", "Analyzing meeting context and computing date windows", 10)
        meeting_req = MeetingRequest.model_validate(request)
        if meeting_req.company.strip().lower() == "failtest":
            raise RuntimeError("External news search rate limit exceeded (Simulated FailTest).")
        window_start, cutoff_date = ResearchPlanner.calculate_time_window(
            meeting_req.meeting_date,
            window_days=config.freshness_window_days,
        )
        window_start_str = window_start.strftime("%Y-%m-%d")
        cutoff_date_str = cutoff_date.strftime("%Y-%m-%d")

        # Initialize pipeline components
        bifrost = BifrostClient()
        tavily = TavilyClient()
        planner = ResearchPlanner(bifrost_client=bifrost)
        researcher = Researcher(tavily_client=tavily, bifrost_client=bifrost)
        verifier = Verifier(bifrost_client=bifrost)
        writer = BriefingWriter(bifrost_client=bifrost)

        # ---------------------------------------------------------
        # Stage 2 – Research planner
        # ---------------------------------------------------------
        _safe_progress(progress_callback, "planning", "Formulating objective-tailored research queries", 20)
        plan = planner.plan_research(meeting_req)
        query_strings = [q.query for q in plan.queries]
        _safe_progress(
            progress_callback,
            "planning",
            f"Formulated {len(query_strings)} research queries",
            25,
            data={"queries": query_strings},
        )

        # ---------------------------------------------------------
        # Stage 3 & 4 – Tavily research & Freshness filtering
        # ---------------------------------------------------------
        _safe_progress(
            progress_callback,
            "searching",
            f"Searching public sources across {len(plan.queries)} categories",
            35,
            data={"queries": query_strings},
        )
        sources: List[NormalizedSource] = researcher.execute_search_plan(
            plan=plan,
            window_start=window_start,
            cutoff_date=cutoff_date,
        )

        source_payloads = [
            {
                "id": s.source_id,
                "title": s.title,
                "publisher": s.publisher or "Web Source",
                "url": s.url,
                "published_at": s.published_at,
                "category": getattr(s, "category", "news"),
            }
            for s in sources
        ]

        # ---------------------------------------------------------
        # Stage 5 – Claim extraction
        # ---------------------------------------------------------
        _safe_progress(
            progress_callback,
            "searching",
            f"Extracted {len(sources)} sources; parsing claims",
            50,
            data={"sources": source_payloads, "queries": query_strings},
        )
        claims: List[ExtractedClaim] = researcher.extract_claims(
            request=meeting_req,
            sources=sources,
            window_start=window_start,
            cutoff_date=cutoff_date,
        )

        # ---------------------------------------------------------
        # Stage 6 – Evidence verification
        # ---------------------------------------------------------
        _safe_progress(
            progress_callback,
            "verifying",
            "Cross-checking claims and temporal boundaries",
            65,
            data={"sources": source_payloads},
        )
        verified_devs, insufficient_categories, limitations = verifier.verify_developments(
            company=meeting_req.company,
            objective=meeting_req.objective,
            claims=claims,
            sources=sources,
            window_start=window_start,
            cutoff_date=cutoff_date,
        )

        verified_ids = list({sid for d in verified_devs for sid in d.source_ids})
        _safe_progress(
            progress_callback,
            "verifying",
            f"Verified {len(verified_devs)} developments across sources",
            68,
            data={
                "sources": source_payloads,
                "verification": {"verified_ids": verified_ids},
            },
        )

        # ---------------------------------------------------------
        # Stage 7 – Iterative research (Hard cap: 2 additional rounds)
        # ---------------------------------------------------------
        max_iterative_rounds = config.max_iterative_rounds
        iter_round = 0
        existing_urls = {s.url for s in sources}
        source_counter = len(sources) + 1

        while insufficient_categories and iter_round < max_iterative_rounds:
            iter_round += 1
            target_category = insufficient_categories.pop(0)
            _safe_progress(
                progress_callback,
                "searching",
                f"Iterative research (round {iter_round}/{max_iterative_rounds}): deepening coverage for '{target_category}'",
                70 + (iter_round * 5),
            )

            # Generate targeted follow-up query
            follow_up_query = f'"{meeting_req.company}" {target_category} {meeting_req.objective} {cutoff_date_str[:4]}'
            try:
                new_sources = tavily.search_and_normalize(
                    query=follow_up_query,
                    id_counter_start=source_counter,
                    existing_urls=existing_urls,
                    max_results=3,
                    topic="news",
                    days=config.freshness_window_days,
                )
                if new_sources:
                    researcher.evaluate_source_freshness(new_sources, window_start, cutoff_date)
                    sources.extend(new_sources)
                    source_counter += len(new_sources)

                    # Extract claims from new sources
                    new_claims = researcher.extract_claims(
                        request=meeting_req,
                        sources=new_sources,
                        window_start=window_start,
                        cutoff_date=cutoff_date,
                    )
                    if new_claims:
                        claims.extend(new_claims)
                        # Re-verify developments
                        verified_devs, more_insufficient, more_limitations = verifier.verify_developments(
                            company=meeting_req.company,
                            objective=meeting_req.objective,
                            claims=claims,
                            sources=sources,
                            window_start=window_start,
                            cutoff_date=cutoff_date,
                        )
                        limitations.extend(more_limitations)
            except Exception as e:
                logger.warning(f"Iterative research round {iter_round} error: {e}")

        # ---------------------------------------------------------
        # Stage 8 – Briefing generation
        # ---------------------------------------------------------
        final_source_payloads = [
            {
                "id": s.source_id,
                "title": s.title,
                "publisher": s.publisher or "Web Source",
                "url": s.url,
                "published_at": s.published_at,
                "category": getattr(s, "category", "news"),
            }
            for s in sources
        ]
        _safe_progress(
            progress_callback,
            "generating",
            "Synthesizing executive briefing document",
            90,
            data={"sources": final_source_payloads},
        )
        briefing: ExecutiveBriefing = writer.write_briefing(
            request=meeting_req,
            verified_developments=verified_devs,
            sources=sources,
            window_start_str=window_start_str,
            cutoff_date_str=cutoff_date_str,
            limitations=limitations,
        )

        _safe_progress(
            progress_callback,
            "completed",
            "Executive briefing generation complete",
            100,
            data={"sources": final_source_payloads},
        )
        return briefing.model_dump()

    except Exception as e:
        logger.error(f"Fatal error in MeetIQ research workflow: {e}", exc_info=True)
        _safe_progress(progress_callback, "failed", f"Research workflow failed: {str(e)}", 100)
        raise

