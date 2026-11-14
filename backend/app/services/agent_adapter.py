import asyncio
import inspect
import json
import logging
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.database_models import Meeting, ResearchSession, Briefing, ResearchSource
from app.services.database import SessionLocal
from app.services.research_manager import stream_manager
from app.utils.helpers import generate_id, format_iso

logger = logging.getLogger("meetiq.agent_adapter")


def get_mock_briefing(company: str, objective: str, meeting_type: str = "Partnership") -> Dict[str, Any]:
    """Generate realistic executive briefing report data for the dummy AI engine."""
    return {
        "company": company,
        "executive_summary": (
            f"Strategic briefing prepared for upcoming {meeting_type} meeting with {company}. "
            f"Core focus centers on '{objective}'. In the past 30 days, {company} has accelerated "
            f"key initiatives across enterprise developer tooling, enterprise cloud integration, and commercial AI offerings. "
            f"Leadership demonstrates strong appetite for partner co-innovation that reduces deployment friction and expands platform TAM."
        ),
        "recent_developments": [
            f"{company} launched upgraded enterprise developer APIs with native telemetry instrumentation.",
            f"Announced executive appointments across Global Partnerships and Strategic Alliances.",
            f"Reported sustained double-digit growth in enterprise recurring revenue during recent quarterly earnings call.",
            f"Expanded multi-cloud compliance and data governance certifications across European and North American zones."
        ],
        "opportunities": [
            f"High alignment with {company}'s publicly stated objective to expand partner ecosystem margins.",
            "Joint go-to-market motion targeting mutual Fortune 500 customers looking for rapid workflow automation.",
            "Potential for co-branded product showcase or keynote feature at upcoming annual developer conference.",
            "Fast-tracked security review through established certified partner frameworks."
        ],
        "risks": [
            f"Competing internal R&D roadmap at {company} could overlap with proposed partnership scope.",
            "Complex enterprise procurement cycles could extend deal closing into subsequent quarters.",
            "Stringent data privacy and regulatory compliance hurdles regarding cross-platform telemetry."
        ],
        "questions": [
            f"How does {company} evaluate revenue-share vs tier-based partner monetization for new technical integrations?",
            "What are the target KPIs and milestone timelines for strategic ecosystem partners in the upcoming fiscal year?",
            "What developer support or sandbox environments are made available to accelerate technical pilot validation?"
        ],
        "sources": [
            {
                "id": "1",
                "title": f"{company} Corporate Press Release & Strategic Direction",
                "publisher": f"{company} Newsroom",
                "published_at": "4d ago",
                "url": f"https://www.{company.lower().replace(' ', '')}.com/newsroom",
                "category": "press"
            },
            {
                "id": "2",
                "title": f"Executive Intelligence & Enterprise Financial Analysis",
                "publisher": "Reuters Technology",
                "published_at": "11d ago",
                "url": "https://www.reuters.com/technology",
                "category": "financial"
            },
            {
                "id": "3",
                "title": f"Industry Analysis: {company}'s Ecosystem Expansion and Cloud Strategy",
                "publisher": "TechCrunch Enterprise",
                "published_at": "2d ago",
                "url": "https://techcrunch.com/enterprise",
                "category": "product"
            },
            {
                "id": "4",
                "title": "Quarterly Earnings & Form 10-Q Filing Highlights",
                "publisher": "SEC EDGAR Filings",
                "published_at": "18d ago",
                "url": "https://www.sec.gov/edgar",
                "category": "financial"
            }
        ],
        "research_limitations": [
            "Proprietary partner margin tiers are subject to signed NDA and not disclosed in public disclosures.",
            "Internal technical roadmaps beyond current quarter announcements remain speculative.",
            "Recent executive hires have not yet published revised departmental strategy mandates."
        ]
    }


async def mock_run_research(request: Dict[str, Any], progress_callback: Callable[[Dict[str, Any]], Any]) -> Dict[str, Any]:
    """
    Dummy AI research orchestrator matching the Person 3 engine interface.
    Emits realistic stage transitions and progress updates via callback.
    """
    company = request.get("company", "Target Company")
    objective = request.get("objective", "Strategic Discussion")
    meeting_type = request.get("meeting_type", "Partnership")
    is_fail_test = company.strip().lower() == "failtest"

    # Stage 1: Planning
    await asyncio.sleep(0.5)
    await progress_callback({
        "stage": "planning",
        "message": f"Analyzing meeting objective for {company}...",
        "progress": 15,
        "data": {
            "queries": [
                f'"{company.lower()} {meeting_type.lower()} news"',
                f'"{company.lower()} leadership updates"',
                f'"{company.lower()} product developments"'
            ]
        }
    })

    # Stage 2: Searching
    await asyncio.sleep(0.7)
    await progress_callback({
        "stage": "searching",
        "message": f"Searching past 30 days of public signals for {company}...",
        "progress": 40,
        "data": {
            "sources": [
                {"id": "1", "title": f"{company} Newsroom", "publisher": f"{company} Blog", "url": f"https://www.{company.lower().replace(' ', '')}.com"},
                {"id": "2", "title": "Reuters Tech", "publisher": "Reuters", "url": "https://reuters.com"}
            ]
        }
    })

    if is_fail_test:
        await asyncio.sleep(0.5)
        raise RuntimeError("External news search rate limit exceeded (Simulated FailTest).")

    # Stage 3: Verifying
    await asyncio.sleep(0.6)
    await progress_callback({
        "stage": "verifying",
        "message": "Verifying citations, financial metrics, and executive signals...",
        "progress": 65,
        "data": {
            "verification": {"verified_ids": ["1", "2"]}
        }
    })

    # Stage 4: Generating
    await asyncio.sleep(0.6)
    await progress_callback({
        "stage": "generating",
        "message": "Synthesizing executive briefing and strategic recommendations...",
        "progress": 85
    })

    # Produce final briefing report
    await asyncio.sleep(0.4)
    return get_mock_briefing(company=company, objective=objective, meeting_type=meeting_type)


async def execute_research_task(research_id: str, meeting_id: str) -> None:
    """
    Background worker that coordinates research execution,
    updates database records, and feeds live SSE events.
    """
    logger.info(f"Starting background research execution for research_id={research_id}, meeting_id={meeting_id}")
    db: Session = SessionLocal()

    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        research_session = db.query(ResearchSession).filter(ResearchSession.id == research_id).first()

        if not meeting or not research_session:
            logger.error(f"Meeting or ResearchSession not found: meeting_id={meeting_id}, research_id={research_id}")
            return

        # Prepare request payload for orchestrator
        request_data = {
            "meeting_id": meeting.id,
            "company": meeting.company,
            "website": meeting.website or "",
            "meeting_date": format_iso(meeting.meeting_date),
            "meeting_type": meeting.meeting_type or "Partnership",
            "objective": meeting.objective,
            "additional_context": meeting.additional_context or ""
        }

        async def handle_progress(event: Dict[str, Any]):
            # 1. Update DB progress
            research_session.current_stage = event.get("stage", research_session.current_stage)
            research_session.progress = event.get("progress", research_session.progress)
            research_session.status = "in_progress"
            db.commit()

            # 2. Broadcast via SSE
            await stream_manager.broadcast_event(research_id, event)

        # Dynamic integration: Attempt Person 3's real module, fallback to mock
        research_orchestrator = None
        try:
            from ai_engine.orchestrator import run_research
            research_orchestrator = run_research
            logger.info("Successfully loaded Person 3's ai_engine.orchestrator.run_research")
        except ImportError:
            logger.info("ai_engine package not detected. Utilizing built-in mock orchestrator.")
            research_orchestrator = mock_run_research

        # Initial progress broadcast
        await handle_progress({
            "stage": "planning",
            "message": "Initiating research plan...",
            "progress": 5
        })

        # Run orchestrator (handle sync or async)
        if inspect.iscoroutinefunction(research_orchestrator):
            result = await research_orchestrator(request=request_data, progress_callback=handle_progress)
        else:
            # Sync wrapper if Person 3 provided synchronous function
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: research_orchestrator(
                    request=request_data,
                    progress_callback=lambda evt: asyncio.run_coroutine_threadsafe(handle_progress(evt), loop).result()
                )
            )

        # Research successfully completed!
        briefing_id = generate_id("brief")
        report_json = json.dumps(result)

        # Save Briefing record
        briefing = Briefing(
            id=briefing_id,
            meeting_id=meeting.id,
            research_id=research_id,
            report_json=report_json,
            created_at=datetime.utcnow()
        )
        db.add(briefing)

        # Save individual sources if present in report
        sources_list = result.get("sources", [])
        for s in sources_list:
            if isinstance(s, dict):
                src = ResearchSource(
                    id=generate_id("src"),
                    research_id=research_id,
                    title=s.get("title", "Untitled Source"),
                    url=s.get("url", ""),
                    publisher=s.get("publisher"),
                    published_at=str(s.get("published_at")) if s.get("published_at") else None,
                    retrieved_at=datetime.utcnow()
                )
                db.add(src)

        # Update Research Session
        research_session.status = "completed"
        research_session.current_stage = "completed"
        research_session.progress = 100
        research_session.completed_at = datetime.utcnow()

        # Update Meeting
        meeting.status = "completed"
        meeting.briefing_id = briefing_id

        db.commit()

        # Broadcast final completed event
        await stream_manager.broadcast_event(research_id, {
            "stage": "completed",
            "message": "Briefing ready",
            "progress": 100,
            "data": {
                "briefing_id": briefing_id
            }
        })
        logger.info(f"Research session {research_id} successfully completed. Briefing {briefing_id} generated.")

    except Exception as exc:
        logger.exception(f"Research failed for session {research_id}: {exc}")
        db.rollback()

        # Update DB session with failure
        if research_session:
            research_session.status = "failed"
            research_session.current_stage = "failed"
            research_session.error_message = str(exc)
            research_session.completed_at = datetime.utcnow()

        if meeting:
            meeting.status = "failed"

        try:
            db.commit()
        except Exception:
            db.rollback()

        # Broadcast failure event
        await stream_manager.broadcast_event(research_id, {
            "stage": "failed",
            "message": str(exc),
            "progress": research_session.progress if research_session else 0,
            "data": {
                "error": str(exc)
            }
        })

    finally:
        db.close()
