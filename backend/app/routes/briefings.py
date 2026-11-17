import json
import logging
from typing import List, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.models.database_models import Briefing, Meeting
from app.models.schemas import BriefingResponse, BriefingReport
from app.services.database import get_db
from app.services.pdf_generator import generate_briefing_pdf
from app.utils.helpers import format_iso

router = APIRouter(prefix="/api/briefings", tags=["Briefings"])
logger = logging.getLogger("meetiq.routes.briefings")


def serialize_briefing(briefing: Briefing, meeting: Meeting = None) -> BriefingResponse:
    """Parse JSON report and serialize Briefing ORM to BriefingResponse schema."""
    try:
        report_dict = json.loads(briefing.report_json) if isinstance(briefing.report_json, str) else briefing.report_json
    except Exception:
        report_dict = {}

    company = report_dict.get("company") or (meeting.company if meeting else "Company")
    meeting_type = (meeting.meeting_type if meeting else None) or "Partnership"
    meeting_date = format_iso(meeting.meeting_date) if meeting and meeting.meeting_date else None

    report = BriefingReport(
        company=company,
        executive_summary=report_dict.get("executive_summary", ""),
        recent_developments=report_dict.get("recent_developments", []),
        opportunities=report_dict.get("opportunities", []),
        risks=report_dict.get("risks", []),
        questions=report_dict.get("questions", []),
        sources=report_dict.get("sources", []),
        research_limitations=report_dict.get("research_limitations", [])
    )

    return BriefingResponse(
        briefing_id=briefing.id,
        id=briefing.id,
        meeting_id=briefing.meeting_id,
        research_id=briefing.research_id,
        company=company,
        meeting_type=meeting_type,
        meeting_date=meeting_date,
        status="completed",
        created_at=format_iso(briefing.created_at) or "",
        report=report
    )


@router.get("", response_model=List[BriefingResponse])
def list_briefings(db: Session = Depends(get_db)):
    """Retrieve all synthesized executive briefings."""
    briefings = db.query(Briefing).order_by(Briefing.created_at.desc()).all()
    results = []
    for b in briefings:
        meeting = db.query(Meeting).filter(Meeting.id == b.meeting_id).first()
        results.append(serialize_briefing(b, meeting))
    return results


@router.get("/{id}", response_model=BriefingResponse)
def get_briefing(id: str, db: Session = Depends(get_db)):
    """Fetch structured JSON report for a specific briefing session."""
    briefing = db.query(Briefing).filter(Briefing.id == id).first()
    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing {id} not found."
        )
    meeting = db.query(Meeting).filter(Meeting.id == briefing.meeting_id).first()
    return serialize_briefing(briefing, meeting)


@router.get("/{id}/pdf")
def get_briefing_pdf(id: str, db: Session = Depends(get_db)):
    """Generate and download a high-resolution executive PDF briefing report."""
    briefing = db.query(Briefing).filter(Briefing.id == id).first()
    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing {id} not found."
        )

    meeting = db.query(Meeting).filter(Meeting.id == briefing.meeting_id).first()

    try:
        report_data = json.loads(briefing.report_json) if isinstance(briefing.report_json, str) else briefing.report_json
    except Exception:
        report_data = {}

    meeting_data = {}
    if meeting:
        meeting_data = {
            "company": meeting.company,
            "website": meeting.website,
            "meeting_date": format_iso(meeting.meeting_date),
            "meeting_type": meeting.meeting_type,
            "objective": meeting.objective,
            "additional_context": meeting.additional_context
        }

    company = report_data.get("company") or meeting_data.get("company", "Meeting")
    sanitized_company = "".join(c for c in company if c.isalnum() or c in ("-", "_")).strip()

    try:
        pdf_bytes = generate_briefing_pdf(meeting_data=meeting_data, report_data=report_data)
    except Exception as exc:
        logger.exception(f"Error rendering PDF for briefing {id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF document: {exc}"
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="MeetIQ_Briefing_{sanitized_company}_{id}.pdf"',
            "Content-Type": "application/pdf"
        }
    )
