from sqlalchemy.orm import Session
from app.models import models
from datetime import datetime
import asyncio
from app.services.websocket_manager import manager

def create_notification(db: Session, user_id: int, title: str, message: str, type: str):
    notification = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        is_read=0
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    # Real-time WebSocket broadcast
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast_notification(user_id, notification))
    except RuntimeError:
        pass

    return notification

def create_alert(db: Session, title: str, message: str, priority: str, department: str = None, assigned_role: str = None):
    alert = models.Alert(
        title=title,
        message=message,
        priority=priority,
        department=department,
        assigned_role=assigned_role,
        is_read=0
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Real-time WebSocket broadcast
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast_alert(alert))
    except RuntimeError:
        pass

    return alert

def check_and_generate_events(db: Session):
    """
    Dynamically checks the database state (tasks, approvals, inventory levels) 
    and generates notifications/alerts for any events that do not yet have them.
    This guarantees that mock & real data alerts/notifications are correctly visible.
    """
    # 1. TASK ASSIGNED Notifications
    tasks = db.query(models.Task).all()
    for task in tasks:
        # Check if notification exists
        existing = db.query(models.Notification).filter(
            models.Notification.type == "TASK_ASSIGNED",
            models.Notification.user_id == task.assigned_to,
            models.Notification.message.like(f"%{task.title}%")
        ).first()
        if not existing:
            create_notification(
                db,
                user_id=task.assigned_to,
                title="Task Assigned",
                message=f"You have been assigned a new task: {task.title}",
                type="TASK_ASSIGNED"
            )

    # 2. PURCHASE APPROVAL Notifications
    approvals = db.query(models.Approval).all()
    # Get HODs and Admins
    admin_and_hods = db.query(models.User).join(models.UserAccount).filter(
        models.UserAccount.role.in_([models.UserRole.SUPER_ADMIN, models.UserRole.HOD])
    ).all()
    for approval in approvals:
        if approval.status == models.ApprovalStatus.PENDING:
            # Notify HODs and Admins
            for u in admin_and_hods:
                existing = db.query(models.Notification).filter(
                    models.Notification.type == "PURCHASE_APPROVAL",
                    models.Notification.user_id == u.id,
                    models.Notification.message.like(f"%PO-{approval.id}%"),
                    models.Notification.message.like("%pending%")
                ).first()
                if not existing:
                    create_notification(
                        db,
                        user_id=u.id,
                        title="New Purchase Approval Required",
                        message=f"New approval request PO-{approval.id} ({approval.request_type}) is pending your review.",
                        type="PURCHASE_APPROVAL"
                    )
        elif approval.status in [models.ApprovalStatus.APPROVED, models.ApprovalStatus.REJECTED]:
            # Notify requester
            existing = db.query(models.Notification).filter(
                models.Notification.type == "PURCHASE_APPROVAL",
                models.Notification.user_id == approval.requested_by,
                models.Notification.message.like(f"%PO-{approval.id}%"),
                models.Notification.message.like(f"%{approval.status.lower()}%")
            ).first()
            if not existing:
                create_notification(
                    db,
                    user_id=approval.requested_by,
                    title=f"Approval Request {approval.status.capitalize()}",
                    message=f"Your approval request PO-{approval.id} ({approval.request_type}) has been {approval.status.lower()}.",
                    type="PURCHASE_APPROVAL"
                )

    # 3. SUPPLIER DELAY (Mocked based on delayed shipments in dashboards)
    # Check if a supplier delay alert already exists
    existing_delay_alert = db.query(models.Alert).filter(
        models.Alert.title == "Supplier Delay",
        models.Alert.message.like("%delayed by 3 days%")
    ).first()
    if not existing_delay_alert:
        # Create Alert
        create_alert(
            db,
            title="Supplier Delay",
            message="Primary supplier 'CavinKare Dairy & Beverages Division' delayed by 3 days on shipment #PO-301.",
            priority="HIGH",
            department="Inventory",
            assigned_role="MANAGER"
        )
        
        # Notify Managers and HODs
        managers_and_hods = db.query(models.User).join(models.UserAccount).filter(
            models.UserAccount.role.in_([models.UserRole.HOD, models.UserRole.MANAGER])
        ).all()
        for u in managers_and_hods:
            create_notification(
                db,
                user_id=u.id,
                title="Supplier Delay Alert",
                message="Supplier 'CavinKare Dairy & Beverages Division' has reported a delay of 3 days on shipment #PO-301.",
                type="SUPPLIER_DELAY"
            )

    # 4. INVENTORY UPDATE Alerts & Notifications
    products = db.query(models.Product).all()
    for product in products:
        if product.current_stock <= product.critical_threshold:
            # Create Alert
            existing_alert = db.query(models.Alert).filter(
                models.Alert.title == "Stock Shortage",
                models.Alert.message.like(f"%{product.name}%")
            ).first()
            if not existing_alert:
                create_alert(
                    db,
                    title="Stock Shortage",
                    message=f"{product.name} stock is critically low ({product.current_stock} units left).",
                    priority="CRITICAL",
                    department="Inventory",
                    assigned_role="HOD"
                )
                
            # Create Notification for Managers & HODs
            managers_and_hods = db.query(models.User).join(models.UserAccount).filter(
                models.UserAccount.role.in_([models.UserRole.HOD, models.UserRole.MANAGER])
            ).all()
            for u in managers_and_hods:
                existing_notif = db.query(models.Notification).filter(
                    models.Notification.type == "INVENTORY_UPDATE",
                    models.Notification.user_id == u.id,
                    models.Notification.message.like(f"%{product.name}%")
                ).first()
                if not existing_notif:
                    create_notification(
                        db,
                        user_id=u.id,
                        title="Critical Stock Alert",
                        message=f"Product {product.name} is critically low (only {product.current_stock} units left).",
                        type="INVENTORY_UPDATE"
                    )

    # 5. FORECAST ALERT Alerts & Notifications
    for product in products:
        if product.current_stock <= product.reorder_level:
            # Create Alert
            existing_alert = db.query(models.Alert).filter(
                models.Alert.title == "Demand Spike Risk",
                models.Alert.message.like(f"%{product.name}%")
            ).first()
            if not existing_alert:
                create_alert(
                    db,
                    title="Demand Spike Risk",
                    message=f"AI predicts depletion risk for {product.name} next month. Reorder recommended.",
                    priority="HIGH",
                    department="Sales",
                    assigned_role="HOD"
                )
                
            # Create Notification for HOD & Super Admin
            hod_and_admins = db.query(models.User).join(models.UserAccount).filter(
                models.UserAccount.role.in_([models.UserRole.SUPER_ADMIN, models.UserRole.HOD])
            ).all()
            for u in hod_and_admins:
                existing_notif = db.query(models.Notification).filter(
                    models.Notification.type == "FORECAST_ALERT",
                    models.Notification.user_id == u.id,
                    models.Notification.message.like(f"%{product.name}%")
                ).first()
                if not existing_notif:
                    create_notification(
                        db,
                        user_id=u.id,
                        title="AI Forecast Alert",
                        message=f"AI predicts depletion risk for {product.name}. Recommended reorder level reached.",
                        type="FORECAST_ALERT"
                    )
