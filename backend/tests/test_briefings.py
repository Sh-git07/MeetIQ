import time
from fastapi.testclient import TestClient


def test_briefing_lifecycle_and_pdf_export(client: TestClient):
    # 1. Create meeting
    m_res = client.post("/api/meetings", json={
        "company": "Snowflake",
        "website": "https://snowflake.com",
        "meeting_date": "2026-11-18T11:00:00Z",
        "meeting_type": "Client meeting",
        "objective": "Review warehouse consumption and telemetry pipelines",
        "additional_context": "Cortex AI adoption"
    })
    assert m_res.status_code == 201
    meeting_id = m_res.json()["meeting_id"]

    # 2. Trigger research
    r_res = client.post(f"/api/meetings/{meeting_id}/research")
    assert r_res.status_code == 200
    research_id = r_res.json()["research_id"]

    # 3. Poll until research is completed
    max_wait = 8.0
    start = time.time()
    briefing_id = None

    while time.time() - start < max_wait:
        s_res = client.get(f"/api/research/{research_id}/status")
        assert s_res.status_code == 200
        s_data = s_res.json()
        if s_data["status"] == "completed":
            briefing_id = s_data.get("briefing_id")
            break
        time.sleep(0.4)

    assert briefing_id is not None, "Research did not produce a briefing within the timeout window"

    # 4. List briefings
    list_res = client.get("/api/briefings")
    assert list_res.status_code == 200
    briefings = list_res.json()
    assert any(b["briefing_id"] == briefing_id for b in briefings)

    # 5. Get single briefing
    b_res = client.get(f"/api/briefings/{briefing_id}")
    assert b_res.status_code == 200
    b_data = b_res.json()
    assert b_data["briefing_id"] == briefing_id
    assert b_data["meeting_id"] == meeting_id
    assert b_data["status"] == "completed"

    report = b_data["report"]
    assert report["company"] == "Snowflake"
    assert "executive_summary" in report
    assert len(report["executive_summary"]) > 20
    assert isinstance(report["recent_developments"], list)
    assert isinstance(report["opportunities"], list)
    assert isinstance(report["risks"], list)
    assert isinstance(report["questions"], list)
    assert isinstance(report["sources"], list)
    assert isinstance(report["research_limitations"], list)

    # 6. PDF export
    pdf_res = client.get(f"/api/briefings/{briefing_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert "attachment" in pdf_res.headers["content-disposition"]
    assert pdf_res.content.startswith(b"%PDF-"), "Generated payload is not a valid PDF file"
    assert len(pdf_res.content) > 1000, "PDF byte content is unusually small"


def test_get_nonexistent_briefing(client: TestClient):
    res = client.get("/api/briefings/non_existent_brief_999")
    assert res.status_code == 404


def test_get_nonexistent_briefing_pdf(client: TestClient):
    res = client.get("/api/briefings/non_existent_brief_999/pdf")
    assert res.status_code == 404
