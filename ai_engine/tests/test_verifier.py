"""
Unit tests for Verifier (Stage 6 & Stage 7).
Covers evidence grounding, recency enforcement, conflicting information detection,
and missing date handling.
"""

from datetime import datetime
import pytest
from unittest.mock import MagicMock
from ai_engine.schemas import ExtractedClaim, NormalizedSource
from ai_engine.verifier import SingleVerification, VerificationReport, Verifier
from ai_engine.integrations.bifrost_client import BifrostError


def test_verifier_filters_out_unsupported_sources():
    """Verify developments referencing non-existent source IDs are flagged and filtered."""
    verifier = Verifier()
    window_start = datetime(2026, 10, 16)
    cutoff_date = datetime(2026, 11, 15)

    claims = [
        ExtractedClaim(
            title="Ghost Announcement",
            description="Fabricated event with no real source",
            source_ids=["src_999"],  # Does not exist in sources
            category="AI",
            meeting_relevance="None",
        )
    ]

    sources = [
        NormalizedSource(
            source_id="src_001",
            title="Real Article",
            url="https://example.com/real",
            content="Actual verified text.",
        )
    ]

    verified, insufficient, limitations = verifier.verify_developments(
        company="Microsoft",
        objective="AI partnership",
        claims=claims,
        sources=sources,
        window_start=window_start,
        cutoff_date=cutoff_date,
    )

    assert len(verified) == 0
    assert any("Excluded development 'Ghost Announcement'" in lim for lim in limitations)


def test_verifier_handles_conflicting_or_rejected_claims():
    """Verify that unverified or conflicting claims rejected by verification report are excluded."""
    mock_bifrost = MagicMock()
    mock_bifrost.generate_structured.return_value = VerificationReport(
        verifications=[
            SingleVerification(
                development_index=0,
                is_verified=False,
                confidence_score=0.1,
                verification_notes="Contradicted by company press release",
            )
        ],
        insufficient_evidence_categories=["Leadership"],
        identified_limitations=["Conflicting rumors detected in market press"],
    )

    verifier = Verifier(bifrost_client=mock_bifrost)
    window_start = datetime(2026, 10, 16)
    cutoff_date = datetime(2026, 11, 15)

    claims = [
        ExtractedClaim(
            title="CEO Rumored Resignation",
            description="Blog claims CEO is resigning immediately.",
            source_ids=["src_001"],
            category="Leadership",
            meeting_relevance="Executive changes",
        )
    ]

    sources = [
        NormalizedSource(
            source_id="src_001",
            title="Rumor Mill Post",
            url="https://rumor.com/ceo",
            content="Unconfirmed sources claim resignation.",
        )
    ]

    verified, insufficient, limitations = verifier.verify_developments(
        company="Microsoft",
        objective="Partnership",
        claims=claims,
        sources=sources,
        window_start=window_start,
        cutoff_date=cutoff_date,
    )

    # Claim must be excluded
    assert len(verified) == 0
    assert "Leadership" in insufficient
    assert any("Contradicted by company press release" in lim for lim in limitations)


def test_verifier_labels_undated_sources():
    """Verify that developments with undated sources are flagged appropriately."""
    verifier = Verifier()
    window_start = datetime(2026, 10, 16)
    cutoff_date = datetime(2026, 11, 15)

    claims = [
        ExtractedClaim(
            title="Architecture Whitepaper",
            description="Technical overview of system architecture.",
            date=None,
            source_ids=["src_001"],
            category="Technical",
            meeting_relevance="Technical synergy",
        )
    ]

    sources = [
        NormalizedSource(
            source_id="src_001",
            title="Whitepaper Doc",
            url="https://example.com/whitepaper",
            content="Architecture whitepaper details.",
            published_at=None,
        )
    ]

    verified, insufficient, limitations = verifier.verify_developments(
        company="Microsoft",
        objective="Partnership",
        claims=claims,
        sources=sources,
        window_start=window_start,
        cutoff_date=cutoff_date,
    )

    assert len(verified) == 1
    assert verified[0].date is None
    assert any("unconfirmed publication dates" in lim for lim in limitations)

