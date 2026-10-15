import pytest
from fastapi.testclient import TestClient
from app.core.security import create_access_token
from app.models import models

def test_websocket_unauthenticated(client):
    """Attempting connection with no token or invalid token should close socket."""
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/dashboard"):
            pass

def test_websocket_authenticated_dashboard(client, db):
    """Verify that a client can successfully connect to the dashboard websocket when authenticated."""
    # Create test user
    user = models.User(username="test_ws_user", email="test_ws@example.com", hashed_password="pw")
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create account mapping
    account = models.UserAccount(user_id=user.id, username=user.username, email=user.email, password_hash="pw", role=models.UserRole.EMPLOYEE)
    db.add(account)
    db.commit()

    token = create_access_token(data={"sub": str(user.id)})

    # Connect to the dashboard WebSocket
    with client.websocket_connect(f"/ws/dashboard?token={token}") as websocket:
        # Check initial message containing depotsCount
        data = websocket.receive_json()
        assert data["event"] == "dashboard_update"
        assert "depotsCount" in data["data"]

def test_websocket_authenticated_alerts(client, db):
    """Verify alerts connection with correct user_id."""
    user = models.User(username="test_ws_user_alerts", email="test_ws_alerts@example.com", hashed_password="pw")
    db.add(user)
    db.commit()
    db.refresh(user)

    account = models.UserAccount(user_id=user.id, username=user.username, email=user.email, password_hash="pw", role=models.UserRole.EMPLOYEE)
    db.add(account)
    db.commit()

    token = create_access_token(data={"sub": str(user.id)})

    # Connect to the alerts WebSocket matching user id
    with client.websocket_connect(f"/ws/alerts/{user.id}?token={token}") as websocket:
        # Should connect successfully
        pass
