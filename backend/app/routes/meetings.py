import logging
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.database_models import Meeting
from app.models.schemas import MeetingCreate, MeetingResponse, MeetingDetail
from app.services.database import get_db
from app.utils.helpers import generate_id, parse_datetime, format_iso

router = APIRouter(prefix="/api/meetings", tags=["Meetings"])
logger = logging.getLogger("meetiq.routes.meetings")


def serialize_meeting(meeting: Meeting) -> MeetingDetail:
    """Format meeting ORM entity into compliant MeetingDetail schema."""
    return MeetingDetail(
        id=meeting.id,
        meeting_id=meeting.id,
        company=meeting.company,
        website=meeting.website,
        meeting_date=format_iso(meeting.meeting_date) or "",
        meeting_type=meeting.meeting_type or "Partnership",
        objective=meeting.objective,
        additional_context=meeting.additional_context,
        status=meeting.status or "created",
        created_at=format_iso(meeting.created_at) or "",
        briefing_id=meeting.briefing_id
    )


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(meeting_in: MeetingCreate, db: Session = Depends(get_db)):
    """Create a new executive meeting research session."""
    meeting_id = generate_id("meet")

    try:
        parsed_date = parse_datetime(meeting_in.meeting_date)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid meeting_date format. Expected ISO 8601 string: {exc}"
        )

    meeting = Meeting(
        id=meeting_id,
        company=meeting_in.company.strip(),
        website=meeting_in.website.strip() if meeting_in.website else None,
        meeting_date=parsed_date,
        meeting_type=meeting_in.meeting_type or "Partnership",
        objective=meeting_in.objective.strip(),
        additional_context=meeting_in.additional_context.strip() if meeting_in.additional_context else None,
        status="created",
        created_at=datetime.utcnow()
    )

    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    logger.info(f"Created meeting: id={meeting.id}, company={meeting.company}")
    return MeetingResponse(
        meeting_id=meeting.id,
        status="created",
        message="Meeting created successfully"
    )


@router.get("", response_model=List[MeetingDetail])
def list_meetings(db: Session = Depends(get_db)):
    """Retrieve all meeting sessions ordered by creation date descending."""
    meetings = db.query(Meeting).order_by(Meeting.created_at.desc()).all()
    return [serialize_meeting(m) for m in meetings]


@router.get("/{id}", response_model=MeetingDetail)
def get_meeting(id: str, db: Session = Depends(get_db)):
    """Retrieve details for a single meeting session."""
    meeting = db.query(Meeting).filter(Meeting.id == id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting {id} not found."
        )
    return serialize_meeting(meeting)
