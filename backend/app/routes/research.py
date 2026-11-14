import asyncio
import json
import logging
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.models.database_models import Meeting, ResearchSession, Briefing
from app.models.schemas import ResearchStartResponse, ResearchStatusResponse
from app.services.database import get_db
from app.services.agent_adapter import execute_research_task
from app.services.research_manager import stream_manager
from app.utils.helpers import generate_id, format_iso

router = APIRouter(tags=["Research"])
logger = logging.getLogger("meetiq.routes.research")


@router.post("/api/meetings/{id}/research", response_model=ResearchStartResponse, status_code=status.HTTP_200_OK)
async def start_meeting_research(id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Initiate an asynchronous AI research session for a meeting."""
    meeting = db.query(Meeting).filter(Meeting.id == id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting {id} not found."
        )

    research_id = generate_id("research")
    now = datetime.utcnow()

    # Create research session entry
    research_session = ResearchSession(
        id=research_id,
        meeting_id=meeting.id,
        status="started",
        progress=0,
        current_stage="planning",
        started_at=now
    )
    meeting.status = "in_progress"

    db.add(research_session)
    db.commit()

    # Dispatch background worker task
    asyncio.create_task(execute_research_task(research_id=research_id, meeting_id=meeting.id))

    logger.info(f"Dispatched research: research_id={research_id} for meeting_id={meeting.id}")
    return ResearchStartResponse(
        research_id=research_id,
        status="started",
        message="Research started"
    )


@router.get("/api/research/{id}/status", response_model=ResearchStatusResponse)
def get_research_status(id: str, db: Session = Depends(get_db)):
    """Fetch current progress and lifecycle status of a research session."""
    session = db.query(ResearchSession).filter(ResearchSession.id == id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Research session {id} not found."
        )

    # Find associated briefing ID if completed
    briefing = db.query(Briefing).filter(Briefing.research_id == id).first()
    briefing_id = briefing.id if briefing else None

    return ResearchStatusResponse(
        research_id=session.id,
        meeting_id=session.meeting_id,
        status=session.status,
        progress=session.progress,
        current_stage=session.current_stage,
        stage=session.current_stage,
        error_message=session.error_message,
        started_at=format_iso(session.started_at) or "",
        completed_at=format_iso(session.completed_at),
        briefing_id=briefing_id
    )


@router.get("/api/research/{id}/events")
async def stream_research_events(id: str, request: Request, db: Session = Depends(get_db)):
    """
    Server-Sent Events (SSE) stream delivering real-time stage updates,
    search signals, and completion notices.
    """
    session = db.query(ResearchSession).filter(ResearchSession.id == id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Research session {id} not found."
        )

    queue = await stream_manager.register_subscriber(id)

    async def event_generator():
        try:
            while True:
                # Check for client disconnect
                if await request.is_disconnected():
                    logger.info(f"Client disconnected from SSE stream {id}")
                    break

                try:
                    # Wait for next event with a periodic heartbeat timeout
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    if event is None:
                        # Terminal signal received
                        break

                    data_str = json.dumps(event)
                    yield f"data: {data_str}\n\n"

                except asyncio.TimeoutError:
                    # Send keep-alive comment to prevent socket timeout
                    yield ": ping\n\n"

        except asyncio.CancelledError:
            logger.info(f"SSE stream cancelled for {id}")
        finally:
            await stream_manager.remove_subscriber(id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
