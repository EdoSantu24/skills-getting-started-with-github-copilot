import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_for_activity_success():
    email = "newstudent@mergington.edu"
    activity = "Chess Club"
    # Ensure not already signed up
    client.get("/activities")
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 200
    assert f"Signed up {email} for {activity}" in response.json()["message"]
    # Check participant added
    activities = client.get("/activities").json()
    assert email in activities[activity]["participants"]


def test_signup_for_activity_already_signed_up():
    email = "michael@mergington.edu"
    activity = "Chess Club"
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]


def test_signup_for_activity_not_found():
    email = "someone@mergington.edu"
    activity = "Nonexistent Club"
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 404
    assert "Activity not found" in response.json()["detail"]
