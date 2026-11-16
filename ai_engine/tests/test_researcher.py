"""
Unit tests for Researcher (Stages 3, 4 & 5).
Covers Tavily search deduplication, freshness filtering, missing publication dates,
empty search results, and API failure handling.
"""

from datetime import datetime
import pytest
from unittest.mock import MagicMock
from ai_engine.integrations.tavily_client import TavilyClient, TavilyError
from ai_engine.integrations.bifrost_client import BifrostError
from ai_engine.researcher import Researcher, ExtractionResponse
from ai_engine.schemas import (
    ExtractedClaim,
    MeetingRequest,
    NormalizedSource,
    ResearchPlan,
    SearchQuery,
)


def test_tavily_canonicalize_url():
    """Verify URL canonicalization strips tracking params and trailing slashes."""
    url1 = "https://WWW.EXAMPLE.COM/news/article/?utm_source=twitter&utm_medium=social#heading"
    url2 = "https://example.com/news/article"
    canonical1 = TavilyClient.canonicalize_url(url1)
    canonical2 = TavilyClient.canonicalize_url(url2)
    assert canonical1 == canonical2
    assert "utm_source" not in canonical1


def test_freshness_filtering_30_days():
    """Verify 30-day window correctly classifies recent, outdated, and undated sources."""
    window_start = datetime(2026, 10, 16)
    cutoff_date = datetime(2026, 11, 15)

    sources = [
        NormalizedSource(
            source_id="src_001",
            title="Recent Launch",
            url="https://example.com/recent",
            published_at="2026-11-05",
        ),
        NormalizedSource(
            source_id="src_002",
            title="Old Story",
            url="https://example.com/old",
            published_at="2026-08-10",
        ),
        NormalizedSource(
            source_id="src_003",
            title="Undated Analysis",
            url="https://example.com/undated",
            published_at=None,
        ),
    ]

    Researcher.evaluate_source_freshness(sources, window_start, cutoff_date)

    # src_001 is within 30 days
    assert sources[0].is_date_verified is True
    assert sources[0].is_within_30_days is True

    # src_002 is older than 30 days
    assert sources[1].is_date_verified is True
    assert sources[1].is_within_30_days is False

    # src_003 is undated
    assert sources[2].is_date_verified is False
    assert sources[2].is_within_30_days is False


def test_tavily_search_failure_resilience():
    """Verify pipeline gracefully handles Tavily search failure without crashing."""
    mock_tavily = MagicMock()
    mock_tavily.search_and_normalize.side_effect = TavilyError("API connection error")

    researcher = Researcher(tavily_client=mock_tavily)
    plan = ResearchPlan(
        company="Microsoft",
        objective="Cloud",
        queries=[SearchQuery(category="Cloud", query="Microsoft Azure", reasoning="")],
    )

    sources = researcher.execute_search_plan(
        plan=plan,
        window_start=datetime(2026, 10, 16),
        cutoff_date=datetime(2026, 11, 15),
    )
    assert sources == []


def test_empty_search_results():
    """Verify claim extraction handles empty search results cleanly."""
    researcher = Researcher()
    req = MeetingRequest(
        company="ObscureStartup",
        meeting_date="2026-11-15T15:00:00Z",
        meeting_type="Investment",
        objective="Seed round evaluation",
    )

    claims = researcher.extract_claims(
        request=req,
        sources=[],
        window_start=datetime(2026, 10, 16),
        cutoff_date=datetime(2026, 11, 15),
    )
    assert claims == []


def test_claim_extraction_with_bifrost_failure_fallback():
    """Verify extraction falls back to heuristic claim extraction if Bifrost fails."""
    mock_bifrost = MagicMock()
    mock_bifrost.generate_structured.side_effect = BifrostError("JSON format invalid")

    researcher = Researcher(bifrost_client=mock_bifrost)
    req = MeetingRequest(
        company="Apple",
        meeting_date="2026-11-15T15:00:00Z",
        meeting_type="Partnership",
        objective="Apple Intelligence integration",
    )

    sources = [
        NormalizedSource(
            source_id="src_001",
            title="Apple Expands Intelligence Features",
            url="https://apple.com/news/1",
            published_at="2026-11-01",
            content="Apple introduced new developer APIs for private cloud compute.",
            is_within_30_days=True,
            is_date_verified=True,
        )
    ]

    claims = researcher.extract_claims(
        request=req,
        sources=sources,
        window_start=datetime(2026, 10, 16),
        cutoff_date=datetime(2026, 11, 15),
    )

    assert len(claims) == 1
    assert claims[0].title == "Apple Expands Intelligence Features"
    assert claims[0].source_ids == ["src_001"]
    assert claims[0].date == "2026-11-01"

