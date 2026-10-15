from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models import models
from app.core import security
from app.services.notification_service import check_and_generate_events
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def should_receive_alert(user_role: str, user_dept: str, alert) -> bool:
    role = user_role.upper()
    dept = (user_dept or "").strip()
    alert_dept = (alert.department or "").strip()
    alert_title = (alert.title or "").strip().upper()
    alert_message = (alert.message or "").strip().upper()
    
    # Super Admin and HOD receive all alerts
    if role == "SUPER_ADMIN":
        return True
    if role == "HOD":
        return True
        
    # Department manager and employee can only receive alerts matching their department
    if not dept or not alert_dept or dept.lower() != alert_dept.lower():
        return False
        
    # Determine severity based on severity field, title, or message content
    is_critical = False
    is_high = False
    is_medium = False
    
    severity = (alert.priority or "MEDIUM").strip().upper()
    if severity == "CRITICAL":
        is_critical = True
    elif severity == "HIGH":
        is_high = True
    elif severity == "MEDIUM" or severity == "LOW":
        is_medium = True
        
    # Critical Alert Types
    if any(x in alert_title or x in alert_message for x in ["STOCK OUT", "TRANSFER FAILURE", "DELIVERY FAILURE", "BUDGET EXCEEDED"]):
        is_critical = True
        is_high = False
        is_medium = False
    # High Alert Types
    elif any(x in alert_title or x in alert_message for x in ["APPROVAL PENDING", "SUPPLIER DELAY", "PAYMENT OVERDUE", "TRANSFER DELAY", "APPROVAL NEEDED"]):
        is_high = True
        is_critical = False
        is_medium = False
    # Medium Alert Types
    elif any(x in alert_title or x in alert_message for x in ["LOW STOCK", "DELAYED TASKS", "SHIPMENT UPDATES"]):
        is_medium = True
        is_critical = False
        is_high = False

    # Route alerts according to severity rules
    if is_critical:
        # Critical Alerts -> Sent to Manager only
        return role == "MANAGER"
    elif is_high:
        # High Alerts -> Sent to Manager only
        return role == "MANAGER"
    else:
        # Medium/Low Alerts -> Sent to Manager and Staff
        return role in ["MANAGER", "EMPLOYEE"]

    return False

def filter_alerts_for_user(query, current_user: models.User, db: Session):
    role = current_user.role
    dept_name = current_user.department.name if current_user.department else None
    
    all_alerts = query.all()
    filtered = []
    
    for alert in all_alerts:
        if should_receive_alert(role, dept_name, alert):
            filtered.append(alert)
            
    return filtered

@router.get("/")
def get_alerts(
    status: Optional[str] = "active",  # active, archived, all
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Get alerts for the current user based on RBAC rules"""
    try:
        try:
            check_and_generate_events(db)
        except Exception as e:
            logger.warning(f"Alert event generation error (non-fatal): {e}")

        query = db.query(models.Alert)
        if status == "archived":
            query = query.filter(models.Alert.is_archived == 1)
        elif status == "active":
            query = query.filter(models.Alert.is_archived == 0)
        query = query.order_by(models.Alert.created_at.desc())
        result = filter_alerts_for_user(query, current_user, db)
        return result if isinstance(result, list) else result.all()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get alerts error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve alerts: {str(e)}")

@router.get("/unread")
def get_unread_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Get unread alerts for the current user based on RBAC rules"""
    try:
        try:
            check_and_generate_events(db)
        except Exception as e:
            logger.warning(f"Alert event generation error (non-fatal): {e}")

        query = db.query(models.Alert).filter(
            models.Alert.is_read == 0,
            models.Alert.is_archived == 0
        ).order_by(models.Alert.created_at.desc())
        result = filter_alerts_for_user(query, current_user, db)
        return result if isinstance(result, list) else result.all()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get unread alerts error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve unread alerts: {str(e)}")

@router.post("/")
def create_alert(alert_data: dict, db: Session = Depends(get_db)):
    """Create a new alert"""
    try:
        db_alert = models.Alert(**alert_data)
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)

        import asyncio
        from app.services.websocket_manager import manager
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast_alert(db_alert))
            loop.create_task(manager.broadcast_dashboard_update())
        except RuntimeError:
            pass

        return db_alert
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Create alert error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create alert: {str(e)}")

@router.put("/{alert_id}/read")
def mark_alert_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Mark an alert as read"""
    try:
        alert = db.query(models.Alert).filter(models.Alert.alert_id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        alert.is_read = 1
        
        # Audit log
        db.add(models.AuditLog(
            user_id=current_user.id,
            action="RESOLVE",
            module="ALERTS",
            details=f"Marked alert ID {alert_id} ('{alert.title}') as read."
        ))
        db.commit()

        import asyncio
        from app.services.websocket_manager import manager
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.send_event_to_user("alerts", current_user.id, "alert_read", {"alert_id": alert_id}))
        except RuntimeError:
            pass

        return {"detail": "Alert marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Mark alert read error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to mark alert as read: {str(e)}")

@router.put("/{alert_id}/archive")
def archive_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Archive an alert"""
    try:
        alert = db.query(models.Alert).filter(models.Alert.alert_id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        alert.is_archived = 1
        
        # Audit log
        db.add(models.AuditLog(
            user_id=current_user.id,
            action="RESOLVE",
            module="ALERTS",
            details=f"Archived alert ID {alert_id} ('{alert.title}')."
        ))
        db.commit()

        import asyncio
        from app.services.websocket_manager import manager
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.send_event_to_user("alerts", current_user.id, "alert_archived", {"alert_id": alert_id}))
        except RuntimeError:
            pass

        return {"detail": "Alert archived"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Archive alert error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to archive alert: {str(e)}")

@router.put("/read-all")
def mark_all_alerts_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Mark all alerts as read for current user based on RBAC rules"""
    try:
        try:
            check_and_generate_events(db)
        except Exception as e:
            logger.warning(f"Alert event generation error (non-fatal): {e}")

        query = db.query(models.Alert).filter(models.Alert.is_read == 0, models.Alert.is_archived == 0)
        result = filter_alerts_for_user(query, current_user, db)

        if isinstance(result, list):
            alert_ids = [a.alert_id for a in result]
            if alert_ids:
                db.query(models.Alert).filter(models.Alert.alert_id.in_(alert_ids)).update({"is_read": 1}, synchronize_session=False)
        else:
            result.update({"is_read": 1}, synchronize_session=False)

        # Audit log for bulk resolve
        db.add(models.AuditLog(
            user_id=current_user.id,
            action="RESOLVE",
            module="ALERTS",
            details="Marked all matching active alerts as read."
        ))
        db.commit()

        import asyncio
        from app.services.websocket_manager import manager
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.send_event_to_user("alerts", current_user.id, "all_alerts_read", {}))
        except RuntimeError:
            pass

        return {"detail": "All alerts marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Mark all alerts read error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to mark all alerts as read: {str(e)}")
