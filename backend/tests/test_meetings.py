from fastapi.testclient import TestClient


def test_create_meeting_success(client: TestClient):
    payload = {
        "company": "Microsoft",
        "website": "https://microsoft.com",
        "meeting_date": "2026-11-15T15:00:00Z",
        "meeting_type": "Partnership",
        "objective": "Explore a strategic partnership",
        "additional_context": "Focus on AI products"
    }
    response = client.post("/api/meetings", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "meeting_id" in data
    assert data["meeting_id"].startswith("meet_")
    assert data["status"] == "created"
    assert data["message"] == "Meeting created successfully"


def test_create_meeting_validation_error(client: TestClient):
    # Missing required 'company' and 'objective'
    payload = {
        "website": "https://invalid.com",
        "meeting_date": "not-a-date"
    }
    response = client.post("/api/meetings", json=payload)
    assert response.status_code == 422


def test_list_and_get_meeting(client: TestClient):
    # 1. Create a meeting
    create_payload = {
        "company": "Stripe",
        "website": "https://stripe.com",
        "meeting_date": "2026-12-01T10:00:00Z",
        "meeting_type": "Sales",
        "objective": "Enterprise billing integration pitch",
        "additional_context": "High-volume developer workflows"
    }
    create_res = client.post("/api/meetings", json=create_payload)
    assert create_res.status_code == 201
    meeting_id = create_res.json()["meeting_id"]

    # 2. List meetings
    list_res = client.get("/api/meetings")
    assert list_res.status_code == 200
    meetings = list_res.json()
    assert isinstance(meetings, list)
    matching = [m for m in meetings if m["meeting_id"] == meeting_id]
    assert len(matching) == 1
    assert matching[0]["company"] == "Stripe"
    assert matching[0]["meeting_type"] == "Sales"

    # 3. Get single meeting
    get_res = client.get(f"/api/meetings/{meeting_id}")
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["meeting_id"] == meeting_id
    assert detail["company"] == "Stripe"
    assert detail["objective"] == "Enterprise billing integration pitch"


def test_get_nonexistent_meeting(client: TestClient):
    res = client.get("/api/meetings/non_existent_id_999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
