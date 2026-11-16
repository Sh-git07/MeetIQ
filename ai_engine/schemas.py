"""
Pydantic schemas for MeetIQ AI Engine.
Includes meeting input request, intermediate pipeline models, and the mandatory output schema.
"""

from datetime import datetime, timezone
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator


# ==========================================
# Input Schema
# ==========================================

class MeetingRequest(BaseModel):
    """Input meeting data provided to run_research."""
    meeting_id: Optional[str] = Field(default=None, description="Unique identifier for the meeting")
    company: str = Field(..., description="Target company name", min_length=1)
    website: Optional[str] = Field(default=None, description="Company official website")
    meeting_date: str = Field(..., description="Meeting date string in ISO format or YYYY-MM-DD")
    meeting_type: str = Field(..., description="Type of meeting, e.g. Partnership, Sales, Investment")
    objective: str = Field(..., description="Core meeting objective", min_length=1)
    additional_context: Optional[str] = Field(default="", description="Additional meeting context or priorities")

    @field_validator("meeting_date")
    @classmethod
    def validate_meeting_date(cls, v: str) -> str:
        # Validate that meeting_date can be parsed as a date or datetime
        clean_v = v.strip()
        try:
            if "T" in clean_v:
                datetime.fromisoformat(clean_v.replace("Z", "+00:00"))
            else:
                datetime.strptime(clean_v, "%Y-%m-%d")
        except Exception as e:
            raise ValueError(f"Invalid meeting_date format '{v}'. Expected ISO format (e.g. 2026-11-15T15:00:00Z) or YYYY-MM-DD: {e}")
        return clean_v


# ==========================================
# Intermediate Models
# ==========================================

class SearchQuery(BaseModel):
    category: str = Field(..., description="Query category e.g. AI product launches, partnerships, leadership, financials, competitors")
    query: str = Field(..., description="Targeted web search query string")
    reasoning: Optional[str] = Field(default="", description="Why this query is crucial for the meeting objective")


class ResearchPlan(BaseModel):
    company: Optional[str] = ""
    objective: Optional[str] = ""
    queries: List[SearchQuery] = Field(default_factory=list)


class NormalizedSource(BaseModel):
    source_id: str
    title: str
    url: str
    publisher: Optional[str] = ""
    published_at: Optional[str] = None
    content: str = ""
    retrieved_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_date_verified: bool = False
    is_within_30_days: bool = False


class ExtractedClaim(BaseModel):
    title: str
    description: str
    date: Optional[str] = None
    importance: Literal["high", "medium", "low"] = "medium"
    meeting_relevance: str
    category: str
    source_ids: List[str] = Field(default_factory=list)


class VerifiedDevelopment(BaseModel):
    title: str
    description: str
    date: Optional[str] = None
    importance: Literal["high", "medium", "low"] = "medium"
    meeting_relevance: str
    source_ids: List[str] = Field(default_factory=list)
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    verification_notes: Optional[str] = ""
    is_verified: bool = True


# ==========================================
# Mandatory Output Schema (strict compliance)
# ==========================================

class RecentDevelopment(BaseModel):
    title: str = Field(..., description="Title of the development")
    description: str = Field(..., description="Factual description of what happened and why it matters")
    date: Optional[str] = Field(default=None, description="Event or publication date (YYYY-MM-DD) if verified, else None")
    importance: Literal["high", "medium", "low"] = Field(default="medium", description="Strategic importance level")
    meeting_relevance: str = Field(..., description="Specific relevance to the meeting objective")
    source_ids: List[str] = Field(default_factory=list, description="List of source_ids supporting this development")


class OpportunityItem(BaseModel):
    title: str = Field(..., description="Opportunity title")
    description: str = Field(..., description="Actionable collaboration or value creation opportunity")
    source_ids: List[str] = Field(default_factory=list, description="Supporting source_ids if evidence-linked")


class RiskItem(BaseModel):
    title: str = Field(..., description="Risk or challenge title")
    description: str = Field(..., description="Strategic, market, or partnership risk")
    source_ids: List[str] = Field(default_factory=list, description="Supporting source_ids if evidence-linked")


class SourceItem(BaseModel):
    source_id: str = Field(..., description="Unique source identifier e.g. src_001")
    title: str = Field(..., description="Source title")
    url: str = Field(..., description="Canonical source URL")
    publisher: Optional[str] = Field(default="", description="Publisher or news domain")
    published_at: Optional[str] = Field(default=None, description="Verified publication date if available")


class ExecutiveBriefing(BaseModel):
    company: str = Field(..., description="Company name")
    executive_summary: str = Field(..., description="Concise executive summary tailored to meeting objective")
    recent_developments: List[RecentDevelopment] = Field(default_factory=list)
    opportunities: List[OpportunityItem] = Field(default_factory=list)
    risks: List[RiskItem] = Field(default_factory=list)
    questions: List[str] = Field(default_factory=list)
    sources: List[SourceItem] = Field(default_factory=list)
    research_limitations: List[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_source_integrity(self) -> "ExecutiveBriefing":
        """Ensure all referenced source_ids exist in the sources array."""
        existing_ids = {s.source_id for s in self.sources}

        # Filter out invalid source references from developments, opportunities, risks
        for dev in self.recent_developments:
            dev.source_ids = [sid for sid in dev.source_ids if sid in existing_ids]

        for opp in self.opportunities:
            opp.source_ids = [sid for sid in opp.source_ids if sid in existing_ids]

        for risk in self.risks:
            risk.source_ids = [sid for sid in risk.source_ids if sid in existing_ids]

        return self
