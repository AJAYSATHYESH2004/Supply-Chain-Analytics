from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from typing import Optional
from app.db.session import SessionLocal
from app.models import models
from app.core.config import settings
from app.services.websocket_manager import manager

router = APIRouter()

def get_user_from_token(token: str, db: Session) -> Optional[models.User]:
    """Decodes JWT and fetches user from DB for authentication."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
        return db.query(models.User).filter(models.User.id == int(user_id)).first()
    except JWTError:
        return None

@router.websocket("/alerts/{user_id}")
async def ws_alerts(websocket: WebSocket, user_id: int, token: str = Query(None)):
    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
        if not user or user.id != user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_account = db.query(models.UserAccount).filter(models.UserAccount.user_id == user.id).first()
        role = user_account.role.value if (user_account and hasattr(user_account.role, "value")) else (user_account.role if user_account else "EMPLOYEE")
        department = user.department.name if user.department else "Inventory"
        
        await manager.connect(websocket, "alerts", user_id, role, department)
        try:
            while True:
                # Keep socket open and receive dummy text/pings
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket, "alerts", user_id)
    finally:
        db.close()

@router.websocket("/notifications/{user_id}")
async def ws_notifications(websocket: WebSocket, user_id: int, token: str = Query(None)):
    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
        if not user or user.id != user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_account = db.query(models.UserAccount).filter(models.UserAccount.user_id == user.id).first()
        role = user_account.role.value if (user_account and hasattr(user_account.role, "value")) else (user_account.role if user_account else "EMPLOYEE")
        department = user.department.name if user.department else "Inventory"

        await manager.connect(websocket, "notifications", user_id, role, department)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket, "notifications", user_id)
    finally:
        db.close()

@router.websocket("/approvals/{user_id}")
async def ws_approvals(websocket: WebSocket, user_id: int, token: str = Query(None)):
    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
        if not user or user.id != user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_account = db.query(models.UserAccount).filter(models.UserAccount.user_id == user.id).first()
        role = user_account.role.value if (user_account and hasattr(user_account.role, "value")) else (user_account.role if user_account else "EMPLOYEE")
        department = user.department.name if user.department else "Inventory"

        await manager.connect(websocket, "approvals", user_id, role, department)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket, "approvals", user_id)
    finally:
        db.close()

@router.websocket("/dashboard")
async def ws_dashboard(websocket: WebSocket, token: str = Query(None)):
    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_account = db.query(models.UserAccount).filter(models.UserAccount.user_id == user.id).first()
        role = user_account.role.value if (user_account and hasattr(user_account.role, "value")) else (user_account.role if user_account else "EMPLOYEE")
        department = user.department.name if user.department else "Inventory"

        await manager.connect(websocket, "dashboard", user.id, role, department)
        # Send initial depots count for Employee dashboard KPI
        depots_count = db.query(models.Depot).count()
        await websocket.send_json({
            "event": "dashboard_update",
            "data": {
                "depotsCount": depots_count
            }
        })
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket, "dashboard", user.id)
    finally:
        db.close()
