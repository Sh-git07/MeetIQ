from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, HttpUrl


# ---------------------------------------------------------
# Meeting Schemas
# ---------------------------------------------------------

class MeetingCreate(BaseModel):
    company: str = Field(..., description="Company or organization name", min_length=1)
    website: Optional[str] = Field(None, description="Company website URL")
    meeting_date: str = Field(..., description="ISO 8601 formatted meeting date/time")
    meeting_type: Optional[str] = Field("Partnership", description="Type of meeting, e.g. Partnership, Sales, Investor")
    objective: str = Field(..., description="Primary meeting objective", min_length=1)
    additional_context: Optional[str] = Field(None, description="Additional context or focus areas")


class MeetingResponse(BaseModel):
    meeting_id: str
    status: str = "created"
    message: str = "Meeting created successfully"


class MeetingDetail(BaseModel):
    id: str
    meeting_id: str
    company: str
    website: Optional[str] = None
    meeting_date: str
    meeting_type: str
    objective: str
    additional_context: Optional[str] = None
    status: str
    created_at: str
    briefing_id: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------
# Research Schemas
# ---------------------------------------------------------

class ResearchStartResponse(BaseModel):
    research_id: str
    status: str = "started"
    message: str = "Research started"


class ResearchStatusResponse(BaseModel):
    research_id: str
    meeting_id: str
    status: str
    progress: int
    current_stage: str
    stage: str
    error_message: Optional[str] = None
    started_at: str
    completed_at: Optional[str] = None
    briefing_id: Optional[str] = None

    model_config = {"from_attributes": True}


class SSEEventPayload(BaseModel):
    stage: str
    message: str
    progress: int
    data: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------
# Briefing Schemas
# ---------------------------------------------------------

class ResearchSourceItem(BaseModel):
    id: Optional[str] = None
    title: str
    url: str
    publisher: Optional[str] = None
    published_at: Optional[str] = None
    category: Optional[str] = None


class BriefingReport(BaseModel):
    company: str
    executive_summary: str
    recent_developments: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    opportunities: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    risks: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    questions: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    sources: List[Union[Dict[str, Any], ResearchSourceItem]] = Field(default_factory=list)
    research_limitations: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)


class BriefingResponse(BaseModel):
    briefing_id: str
    id: Optional[str] = None
    meeting_id: str
    research_id: Optional[str] = None
    company: Optional[str] = None
    meeting_type: Optional[str] = None
    meeting_date: Optional[str] = None
    status: str = "completed"
    created_at: str
    report: BriefingReport

    model_config = {"from_attributes": True}


class BriefingListItem(BaseModel):
    briefing_id: str
    meeting_id: str
    company: str
    meeting_type: Optional[str] = None
    created_at: str
    status: str

    model_config = {"from_attributes": True}
