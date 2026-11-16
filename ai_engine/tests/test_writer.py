"""
Unit tests for BriefingWriter (Stage 8).
Covers mandatory schema compliance, source integrity validation,
handling rich vs sparse news, and deterministic fallback generation.
"""

import pytest
from unittest.mock import MagicMock
from ai_engine.schemas import (
    ExecutiveBriefing,
    MeetingRequest,
    NormalizedSource,
    OpportunityItem,
    RecentDevelopment,
    RiskItem,
    SourceItem,
    VerifiedDevelopment,
)
from ai_engine.writer import BriefingWriter
from ai_engine.integrations.bifrost_client import BifrostError


def test_briefing_schema_validates_and_enforces_source_ids():
    """Verify ExecutiveBriefing schema automatically sanitizes dangling source_ids."""
    briefing = ExecutiveBriefing(
        company="Microsoft",
        executive_summary="Summary text.",
        recent_developments=[
            RecentDevelopment(
                title="AI Update",
                description="Launched new tool",
                date="2026-11-10",
                importance="high",
                meeting_relevance="Direct",
                source_ids=["src_001", "src_invalid"],
            )
        ],
        opportunities=[
            OpportunityItem(
                title="Joint AI",
                description="Collaborate on models",
                source_ids=["src_001", "src_ghost"],
            )
        ],
        risks=[
            RiskItem(
                title="Market Risk",
                description="Competitor moves",
                source_ids=["src_999"],
            )
        ],
        questions=["What are your timeline expectations?"],
        sources=[
            SourceItem(
                source_id="src_001",
                title="Valid Source",
                url="https://microsoft.com/news",
                publisher="Microsoft",
                published_at="2026-11-10",
            )
        ],
        research_limitations=[],
    )

    # Validate that invalid source IDs are filtered out
    assert briefing.recent_developments[0].source_ids == ["src_001"]
    assert briefing.opportunities[0].source_ids == ["src_001"]
    assert briefing.risks[0].source_ids == []


def test_writer_with_substantial_recent_news():
    """Verify briefing generation for company with rich verified developments."""
    writer = BriefingWriter()
    req = MeetingRequest(
        company="Microsoft",
        meeting_date="2026-11-15T15:00:00Z",
        meeting_type="Partnership",
        objective="Enterprise AI co-sell",
    )

    devs = [
        VerifiedDevelopment(
            title="Azure AI Foundry Launch",
            description="Released new enterprise agent runtime",
            date="2026-11-04",
            importance="high",
            meeting_relevance="Core infrastructure for partnership",
            source_ids=["src_001"],
            confidence_score=0.95,
        ),
        VerifiedDevelopment(
            title="Copilot Security Upgrade",
            description="Enhanced enterprise data governance",
            date="2026-10-28",
            importance="high",
            meeting_relevance="Meets client enterprise requirements",
            source_ids=["src_002"],
            confidence_score=0.92,
        ),
    ]

    sources = [
        NormalizedSource(
            source_id="src_001",
            title="Azure AI News",
            url="https://azure.microsoft.com/ai",
            publisher="Azure Blog",
            published_at="2026-11-04",
        ),
        NormalizedSource(
            source_id="src_002",
            title="Copilot Governance",
            url="https://news.microsoft.com/copilot",
            publisher="MS News",
            published_at="2026-10-28",
        ),
    ]

    briefing = writer._generate_fallback_briefing(
        request=req,
        verified_developments=devs,
        sources=sources,
        limitations=[],
    )

    data = briefing.model_dump()
    assert data["company"] == "Microsoft"
    assert len(data["recent_developments"]) == 2
    assert len(data["sources"]) == 2
    assert len(data["opportunities"]) >= 1
    assert len(data["risks"]) >= 1
    assert len(data["questions"]) >= 3


def test_writer_with_sparse_news_handles_empty_evidence():
    """Verify briefing generation when company has very little or no recent public news."""
    writer = BriefingWriter()
    req = MeetingRequest(
        company="StealthStealthCorp",
        meeting_date="2026-11-15T15:00:00Z",
        meeting_type="Acquisition",
        objective="Evaluate proprietary algorithms",
    )

    briefing = writer._generate_fallback_briefing(
        request=req,
        verified_developments=[],
        sources=[],
        limitations=["No public news articles detected in 30-day window."],
    )

    data = briefing.model_dump()
    assert data["company"] == "StealthStealthCorp"
    assert data["recent_developments"] == []
    assert data["sources"] == []
    assert len(data["research_limitations"]) == 1
    assert len(data["opportunities"]) >= 1
    assert len(data["questions"]) >= 3


def test_writer_handles_bifrost_failure_without_crashing():
    """Verify writer gracefully falls back to deterministic briefing when Bifrost errors out."""
    mock_bifrost = MagicMock()
    mock_bifrost.generate_structured.side_effect = BifrostError("Bifrost rate limit 429")

    writer = BriefingWriter(bifrost_client=mock_bifrost)
    req = MeetingRequest(
        company="Google",
        meeting_date="2026-11-15T15:00:00Z",
        meeting_type="Cloud Review",
        objective="Gemini API deployment",
    )

    devs = [
        VerifiedDevelopment(
            title="Gemini 2.0 Flash Release",
            description="Lower latency multimodal reasoning",
            date="2026-11-01",
            importance="high",
            meeting_relevance="Architecture cost reduction",
            source_ids=["src_001"],
            confidence_score=0.98,
        )
    ]

    sources = [
        NormalizedSource(
            source_id="src_001",
            title="Google DeepMind Blog",
            url="https://blog.google/technology/ai/gemini-2",
            publisher="Google Blog",
            published_at="2026-11-01",
        )
    ]

    briefing = writer.write_briefing(
        request=req,
        verified_developments=devs,
        sources=sources,
        window_start_str="2026-10-16",
        cutoff_date_str="2026-11-15",
        limitations=[],
    )

    # Must be valid ExecutiveBriefing object
    assert isinstance(briefing, ExecutiveBriefing)
    assert briefing.company == "Google"
    assert len(briefing.recent_developments) == 1
    assert briefing.recent_developments[0].source_ids == ["src_001"]

