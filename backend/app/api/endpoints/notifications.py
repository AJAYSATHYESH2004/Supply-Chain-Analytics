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

def filter_notifications_by_role(notifications, role: str):
    role = role.upper()
    if role in ["SUPER_ADMIN", "HOD"]:
        return notifications
        
    filtered = []
    for notif in notifications:
        n_type = (notif.type or "").upper()
        n_title = (notif.title or "").upper()
        n_message = (notif.message or "").upper()
        
        # Operational Updates
        is_operational = (
            n_type in ["TASK_ASSIGNED", "OPERATIONAL_UPDATE", "TASK_UPDATE", "STOCK_MOVEMENT"] or
            any(x in n_title or x in n_message for x in ["TASK", "ASSIGNED", "OPERATION", "STOCK IN", "STOCK OUT", "PHYSICAL STOCK", "VERIFY"])
        )
        
        # Department Summary & Team Updates
        is_summary_or_team = (
            n_type in ["SUPPLIER_DELAY", "INVENTORY_UPDATE", "FORECAST_ALERT", "TEAM_UPDATE", "DEPARTMENT_SUMMARY", "PURCHASE_APPROVAL"] or
            any(x in n_title or x in n_message for x in ["SUMMARY", "DELAY", "FORECAST", "REORDER", "PERFORMANCE", "TEAM", "BUDGET", "REVENUE", "SUPPLIER", "APPROVAL"])
        )
        
        if role == "MANAGER" and is_summary_or_team:
            filtered.append(notif)
        elif role == "EMPLOYEE" and is_operational:
            filtered.append(notif)
            
    return filtered

@router.get("/")
def get_notifications(
    status: Optional[str] = "unread",  # all, read, unread, archived
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Get all notifications for the current user (triggers dynamic event generation first)"""
    try:
        try:
            check_and_generate_events(db)
        except Exception as e:
            logger.warning(f"Notification event generation error (non-fatal): {e}")

        query = db.query(models.Notification).filter(
            models.Notification.user_id == current_user.id
        )
        if status == "unread":
            query = query.filter(models.Notification.is_read == 0, models.Notification.is_archived == 0)
        elif status == "read":
            query = query.filter(models.Notification.is_read == 1, models.Notification.is_archived == 0)
        elif status == "archived":
            query = query.filter(models.Notification.is_archived == 1)
        else:
            query = query.filter(models.Notification.is_archived == 0)

        if department:
            query = query.filter(models.Notification.department == department)

        results = query.order_by(models.Notification.created_at.desc()).all()
        role = current_user.account.role if current_user.account else current_user.role
        return filter_notifications_by_role(results, role)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get notifications error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve notifications: {str(e)}")

@router.get("/unread")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Get the count of unread notifications for the current user"""
    try:
        try:
            check_and_generate_events(db)
        except Exception as e:
            logger.warning(f"Notification event generation error (non-fatal): {e}")

        query = db.query(models.Notification).filter(
            models.Notification.user_id == current_user.id,
            models.Notification.is_read == 0,
            models.Notification.is_archived == 0
        )
        results = query.all()
        role = current_user.account.role if current_user.account else current_user.role
        filtered_results = filter_notifications_by_role(results, role)
        return {"count": len(filtered_results)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get unread count error: {e}", exc_info=True)
        return {"count": 0}  # Safe fallback — badge shows 0 instead of crashing

@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Mark a notification as read"""
    try:
        notif = db.query(models.Notification).filter(
            models.Notification.id == notification_id,
            models.Notification.user_id == current_user.id
        ).first()
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found")

        notif.is_read = 1
        db.commit()

        import asyncio
        from app.services.websocket_manager import manager
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.send_event_to_user("notifications", current_user.id, "notification_read", {"id": notification_id}))
        except RuntimeError:
            pass

        return {"detail": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Mark notification read error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to mark notification as read: {str(e)}")

@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Mark all notifications as read for current user"""
    try:
        db.query(models.Notification).filter(
            models.Notification.user_id == current_user.id,
            models.Notification.is_read == 0,
            models.Notification.is_archived == 0
        ).update({"is_read": 1}, synchronize_session=False)
        db.commit()

        import asyncio
        from app.services.websocket_manager import manager
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.send_event_to_user("notifications", current_user.id, "all_notifications_read", {}))
        except RuntimeError:
            pass

        return {"detail": "All notifications marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Mark all notifications read error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to mark all notifications as read: {str(e)}")

@router.put("/{notification_id}/archive")
def archive_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Archive a notification"""
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_archived = 1
    db.commit()
    
    # Real-time WebSocket update to sync status across tabs
    import asyncio
    from app.services.websocket_manager import manager
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.send_event_to_user("notifications", current_user.id, "notification_archived", {"id": notification_id}))
    except RuntimeError:
        pass
        
    return {"detail": "Notification archived"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Delete a notification"""
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    db.delete(notif)
    db.commit()
    
    # Real-time WebSocket update to sync status across tabs
    import asyncio
    from app.services.websocket_manager import manager
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.send_event_to_user("notifications", current_user.id, "notification_deleted", {"id": notification_id}))
    except RuntimeError:
        pass
        
    return {"detail": "Notification deleted"}
