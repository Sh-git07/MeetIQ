"""
Unit tests for ResearchPlanner (Stages 1 & 2).
Covers different meeting objectives, query differentiation, and Bifrost failure fallbacks.
"""

import pytest
from unittest.mock import MagicMock
from ai_engine.planner import ResearchPlanner
from ai_engine.schemas import MeetingRequest, ResearchPlan, SearchQuery
from ai_engine.integrations.bifrost_client import BifrostError


def test_time_window_calculation():
    start, cutoff = ResearchPlanner.calculate_time_window("2026-11-15T15:00:00Z", window_days=30)
    assert cutoff.year == 2026
    assert cutoff.month == 11
    assert cutoff.day == 15
    assert (cutoff - start).days == 30


def test_invalid_date_raises_validation_error():
    with pytest.raises(Exception):
        MeetingRequest(
            company="Microsoft",
            meeting_date="invalid-date-format",
            meeting_type="Partnership",
            objective="Explore AI partnership",
        )


def test_planner_differentiates_queries_by_objective():
    """Verify that different meeting objectives produce distinctly different search queries."""
    planner = ResearchPlanner()

    req_ai_partnership = MeetingRequest(
        company="Microsoft",
        meeting_date="2026-11-15T15:00:00Z",
        meeting_type="Partnership",
        objective="Form strategic partnership on enterprise AI agents",
    )

    req_acquisition = MeetingRequest(
        company="Microsoft",
        meeting_date="2026-11-15T15:00:00Z",
        meeting_type="M&A",
        objective="Evaluate acquisition of quantum hardware division",
    )

    plan1 = planner.plan_research(req_ai_partnership)
    plan2 = planner.plan_research(req_acquisition)

    queries1 = [q.query.lower() for q in plan1.queries]
    queries2 = [q.query.lower() for q in plan2.queries]

    # Queries must not be identical
    assert queries1 != queries2

    # Query 1 should reference AI/agents, Query 2 should reference quantum/acquisition
    ai_found = any("ai" in q or "agent" in q for q in queries1)
    quantum_found = any("quantum" in q or "acquisition" in q for q in queries2)
    assert ai_found, "AI partnership queries should target AI"
    assert quantum_found, "M&A quantum queries should target quantum or acquisition"


def test_planner_uses_bifrost_when_available():
    """Verify planner uses Bifrost structured output when LLM is responding."""
    mock_bifrost = MagicMock()
    mock_bifrost.generate_structured.return_value = ResearchPlan(
        company="Microsoft",
        objective="Cloud security",
        queries=[
            SearchQuery(
                category="Security",
                query="Microsoft Entra zero trust updates 2026",
                reasoning="Key focus area for security meeting",
            )
        ],
    )

    planner = ResearchPlanner(bifrost_client=mock_bifrost)
    req = MeetingRequest(
        company="Microsoft",
        meeting_date="2026-11-15T15:00:00Z",
        meeting_type="Security Review",
        objective="Cloud security compliance",
    )

    plan = planner.plan_research(req)
    assert len(plan.queries) == 1
    assert "Microsoft Entra" in plan.queries[0].query
    mock_bifrost.generate_structured.assert_called_once()


def test_planner_handles_bifrost_failure_gracefully():
    """Verify planner falls back to deterministic objective-aligned planning when Bifrost fails."""
    mock_bifrost = MagicMock()
    mock_bifrost.generate_structured.side_effect = BifrostError("Bifrost gateway timeout")

    planner = ResearchPlanner(bifrost_client=mock_bifrost)
    req = MeetingRequest(
        company="NVIDIA",
        meeting_date="2026-11-15T15:00:00Z",
        meeting_type="Procurement",
        objective="Secure GPU server cluster allocations",
    )

    # Should not raise exception
    plan = planner.plan_research(req)
    assert plan.company == "NVIDIA"
    assert len(plan.queries) >= 3
    assert any("GPU" in q.query or "NVIDIA" in q.query for q in plan.queries)

