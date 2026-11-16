"""
Integration tests for MeetIQ AI Engine orchestrator.
Includes end-to-end pipeline test with mocks and a genuine live integration test
that is automatically skipped when live API credentials are not present in .env.
"""

import pytest
from unittest.mock import MagicMock, patch
from ai_engine.config import config
from ai_engine.orchestrator import run_research
from ai_engine.schemas import (
    ExecutiveBriefing,
    NormalizedSource,
    ResearchPlan,
    SearchQuery,
)


def test_orchestrator_mocked_end_to_end():
    """
    Test full end-to-end orchestration pipeline with mocked integrations:
    - Verifies stages: planning, searching, verifying, generating, completed.
    - Verifies output format and schema adherence.
    - Verifies progress_callback receives all stages.
    """
    progress_events = []

    def progress_cb(evt):
        progress_events.append(evt)

    sample_request = {
        "meeting_id": "meet_test_001",
        "company": "Microsoft",
        "website": "https://microsoft.com",
        "meeting_date": "2026-11-15T15:00:00Z",
        "meeting_type": "Partnership",
        "objective": "Explore a strategic partnership around enterprise agentic workflows",
        "additional_context": "Focus on AI products",
    }

    mock_sources = [
        NormalizedSource(
            source_id="src_001",
            title="Microsoft Launches Azure AI Agent Service",
            url="https://azure.microsoft.com/blog/agent-service",
            publisher="Azure Blog",
            published_at="2026-11-04",
            content="Microsoft announces general availability of Azure AI Agent Service for multi-agent workflows.",
            is_within_30_days=True,
            is_date_verified=True,
        )
    ]

    with patch("ai_engine.orchestrator.TavilyClient") as MockTavily, \
         patch("ai_engine.orchestrator.BifrostClient") as MockBifrost:

        mock_tavily_instance = MockTavily.return_value
        mock_tavily_instance.search_and_normalize.return_value = mock_sources

        mock_bifrost_instance = MockBifrost.return_value
        # Let Bifrost raise BifrostError to test deterministic fallback synthesis or mock structured
        mock_bifrost_instance.generate_structured.side_effect = Exception("Mock LLM offline for deterministic path")

        result = run_research(request=sample_request, progress_callback=progress_cb)

        # Validate that output is a dict conforming to ExecutiveBriefing schema
        validated = ExecutiveBriefing.model_validate(result)
        assert validated.company == "Microsoft"
        assert len(validated.sources) >= 1
        assert validated.sources[0].source_id == "src_001"
        assert len(validated.recent_developments) >= 1

        # Check that progress stages were fired
        stages = [e["stage"] for e in progress_events]
        assert "planning" in stages
        assert "searching" in stages
        assert "verifying" in stages
        assert "generating" in stages
        assert "completed" in stages


def test_orchestrator_handles_buggy_callback():
    """Verify that an exception raised inside the user progress_callback does not crash research."""
    def buggy_callback(evt):
        raise RuntimeError("User callback threw unexpected error")

    sample_request = {
        "company": "Microsoft",
        "meeting_date": "2026-11-15T15:00:00Z",
        "meeting_type": "Partnership",
        "objective": "Strategic Alliance",
    }

    with patch("ai_engine.orchestrator.TavilyClient"), \
         patch("ai_engine.orchestrator.BifrostClient") as MockBifrost:
        MockBifrost.return_value.generate_structured.side_effect = Exception("LLM offline")
        # Should complete without raising user callback's exception
        result = run_research(request=sample_request, progress_callback=buggy_callback)
        assert result["company"] == "Microsoft"


@pytest.mark.skipif(
    not config.has_live_credentials(),
    reason=(
        "Live integration test skipped: BIFROST_API_KEY and/or TAVILY_API_KEY not configured in .env. "
        "To run live: create a local .env with valid keys and rerun pytest."
    ),
)
def test_live_genuine_end_to_end():
    """
    Genuine Live End-to-End Integration Test.
    Connects to live Bifrost LLM Gateway and live Tavily Search API.
    Only runs if valid credentials are present in the local .env.
    """
    sample_request = {
        "meeting_id": "live_meet_001",
        "company": "Microsoft",
        "website": "https://microsoft.com",
        "meeting_date": "2026-11-15T15:00:00Z",
        "meeting_type": "Partnership",
        "objective": "Explore enterprise AI partnership opportunities",
        "additional_context": "Focus on recent agentic AI releases",
    }

    stages_seen = []

    def on_progress(p):
        stages_seen.append(p["stage"])
        print(f"[{p['stage'].upper()}] {p['progress']}% - {p['message']}")

    result = run_research(request=sample_request, progress_callback=on_progress)

    # Validate schema
    validated = ExecutiveBriefing.model_validate(result)
    assert validated.company == "Microsoft"
    assert validated.executive_summary
    assert isinstance(validated.recent_developments, list)
    assert isinstance(validated.sources, list)
    assert "completed" in stages_seen
