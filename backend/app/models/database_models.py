from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String(64), primary_key=True, index=True)
    company = Column(String(255), nullable=False, index=True)
    website = Column(String(512), nullable=True)
    meeting_date = Column(DateTime, nullable=False)
    meeting_type = Column(String(128), default="Partnership")
    objective = Column(Text, nullable=False)
    additional_context = Column(Text, nullable=True)
    status = Column(String(64), default="created")
    briefing_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    research_sessions = relationship("ResearchSession", back_populates="meeting", cascade="all, delete-orphan")
    briefings = relationship("Briefing", back_populates="meeting", cascade="all, delete-orphan")


class ResearchSession(Base):
    __tablename__ = "research_sessions"

    id = Column(String(64), primary_key=True, index=True)
    meeting_id = Column(String(64), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(64), default="started", nullable=False)  # started, in_progress, completed, failed
    progress = Column(Integer, default=0, nullable=False)
    current_stage = Column(String(64), default="planning", nullable=False)  # planning, searching, verifying, generating, completed, failed
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    meeting = relationship("Meeting", back_populates="research_sessions")
    sources = relationship("ResearchSource", back_populates="research_session", cascade="all, delete-orphan")
    briefings = relationship("Briefing", back_populates="research_session", cascade="all, delete-orphan")


class Briefing(Base):
    __tablename__ = "briefings"

    id = Column(String(64), primary_key=True, index=True)
    meeting_id = Column(String(64), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    research_id = Column(String(64), ForeignKey("research_sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    report_json = Column(Text, nullable=False)  # Serialized JSON of BriefingReport
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    meeting = relationship("Meeting", back_populates="briefings")
    research_session = relationship("ResearchSession", back_populates="briefings")


class ResearchSource(Base):
    __tablename__ = "research_sources"

    id = Column(String(64), primary_key=True, index=True)
    research_id = Column(String(64), ForeignKey("research_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(512), nullable=False)
    url = Column(Text, nullable=False)
    publisher = Column(String(255), nullable=True)
    published_at = Column(String(128), nullable=True)
    retrieved_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    research_session = relationship("ResearchSession", back_populates="sources")
