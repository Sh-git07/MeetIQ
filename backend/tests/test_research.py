import time
from fastapi.testclient import TestClient


def test_start_research_success(client: TestClient):
    # Create meeting
    m_res = client.post("/api/meetings", json={
        "company": "Nvidia",
        "website": "https://nvidia.com",
        "meeting_date": "2026-11-20T14:00:00Z",
        "meeting_type": "Investor",
        "objective": "Assess AI data center roadmap",
        "additional_context": "Next-gen inference chips"
    })
    meeting_id = m_res.json()["meeting_id"]

    # Start research
    r_res = client.post(f"/api/meetings/{meeting_id}/research")
    assert r_res.status_code == 200
    r_data = r_res.json()
    assert "research_id" in r_data
    assert r_data["research_id"].startswith("research_")
    assert r_data["status"] == "started"
    assert r_data["message"] == "Research started"

    research_id = r_data["research_id"]

    # Check status polling
    s_res = client.get(f"/api/research/{research_id}/status")
    assert s_res.status_code == 200
    s_data = s_res.json()
    assert s_data["research_id"] == research_id
    assert s_data["meeting_id"] == meeting_id
    assert s_data["status"] in ("started", "in_progress", "completed")


def test_start_research_nonexistent_meeting(client: TestClient):
    r_res = client.post("/api/meetings/non_existent_meet_999/research")
    assert r_res.status_code == 404


def test_get_nonexistent_research_status(client: TestClient):
    s_res = client.get("/api/research/non_existent_research_999/status")
    assert s_res.status_code == 404


def test_sse_endpoint_connectivity(client: TestClient):
    # Create meeting & research
    m_res = client.post("/api/meetings", json={
        "company": "Anthropic",
        "website": "https://anthropic.com",
        "meeting_date": "2026-11-25T16:00:00Z",
        "meeting_type": "Partnership",
        "objective": "Claude enterprise integration",
        "additional_context": "API reliability"
    })
    meeting_id = m_res.json()["meeting_id"]
    r_res = client.post(f"/api/meetings/{meeting_id}/research")
    research_id = r_res.json()["research_id"]

    # Connect to SSE endpoint with stream=True
    with client.stream("GET", f"/api/research/{research_id}/events") as sse_stream:
        assert sse_stream.status_code == 200
        assert "text/event-stream" in sse_stream.headers["content-type"]
        # Read the first event
        for line in sse_stream.iter_lines():
            if line.startswith("data:"):
                assert "stage" in line
                break


def test_ai_engine_failure_scenario(client: TestClient):
    # Company "FailTest" triggers simulated failure in mock engine
    m_res = client.post("/api/meetings", json={
        "company": "FailTest",
        "website": "https://failtest.com",
        "meeting_date": "2026-11-30T10:00:00Z",
        "meeting_type": "Sales",
        "objective": "Test failure resiliency",
        "additional_context": "Rate limit handling"
    })
    meeting_id = m_res.json()["meeting_id"]
    r_res = client.post(f"/api/meetings/{meeting_id}/research")
    research_id = r_res.json()["research_id"]

    # Poll until terminal state (completed or failed)
    max_wait = 6.0
    start = time.time()
    terminal_status = None

    while time.time() - start < max_wait:
        s_res = client.get(f"/api/research/{research_id}/status")
        status_data = s_res.json()
        if status_data["status"] in ("completed", "failed"):
            terminal_status = status_data
            break
        time.sleep(0.3)

    assert terminal_status is not None, "Research did not reach terminal state within timeout"
    assert terminal_status["status"] == "failed"
    assert "rate limit exceeded" in terminal_status["error_message"].lower()
