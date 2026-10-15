from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models
from app.core.security import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=dict)
def employee_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        dept_id = current_user.department_id
        dept_name = current_user.department.name if current_user.department else "Inventory"

        # Assigned tasks
        tasks = []
        try:
            tasks = db.query(models.Task).filter(
                models.Task.assigned_to == current_user.id
            ).order_by(models.Task.due_date.asc()).all()
        except Exception as e:
            logger.warning(f"Employee tasks error: {e}")

        assigned_tasks = [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "priority": t.priority,
                "status": t.status,
                "due_date": t.due_date.isoformat() if t.due_date else None,
            }
            for t in tasks
        ]

        tasks_pending     = sum(1 for t in tasks if t.status == models.TaskStatus.PENDING)
        tasks_completed   = sum(1 for t in tasks if t.status == models.TaskStatus.COMPLETED)
        tasks_in_progress = sum(1 for t in tasks if t.status == models.TaskStatus.IN_PROGRESS)

        # Inventory updates
        inventory_updates = []
        try:
            if dept_id:
                dept_product_ids = [
                    p.id for p in db.query(models.Product).filter(
                        models.Product.department_id == dept_id
                    ).all()
                ]
                if dept_product_ids:
                    recent_txns = db.query(models.InventoryTransaction).filter(
                        models.InventoryTransaction.product_id.in_(dept_product_ids)
                    ).order_by(models.InventoryTransaction.timestamp.desc()).limit(10).all()
                    inventory_updates = [
                        {
                            "id": txn.id,
                            "product_id": txn.product_id,
                            "transaction_type": txn.transaction_type,
                            "quantity": txn.quantity,
                            "reason": txn.reason,
                            "timestamp": txn.timestamp.isoformat() if txn.timestamp else None,
                        }
                        for txn in recent_txns
                    ]
        except Exception as e:
            logger.warning(f"Inventory updates error: {e}")

        # Notifications from audit logs
        notifications_data = []
        try:
            notifications = db.query(models.AuditLog).filter(
                models.AuditLog.user_id == current_user.id
            ).order_by(models.AuditLog.timestamp.desc()).limit(5).all()
            notifications_data = [
                {
                    "id": n.id,
                    "action": n.action,
                    "module": n.module,
                    "details": n.details,
                    "timestamp": n.timestamp.isoformat() if n.timestamp else None,
                }
                for n in notifications
            ]
        except Exception as e:
            logger.warning(f"Notifications error: {e}")

        # Recent dept activity
        recent_activities = []
        try:
            dept_user_ids = []
            if dept_id:
                dept_user_ids = [
                    u.id for u in db.query(models.User).filter(
                        models.User.department_id == dept_id
                    ).all()
                ]
            if dept_user_ids:
                recent_logs = db.query(models.AuditLog).filter(
                    models.AuditLog.user_id.in_(dept_user_ids)
                ).order_by(models.AuditLog.timestamp.desc()).limit(8).all()
                recent_activities = [
                    {
                        "id": l.id,
                        "action": l.action,
                        "module": l.module,
                        "details": l.details,
                        "user_id": l.user_id,
                        "timestamp": l.timestamp.isoformat() if l.timestamp else None,
                    }
                    for l in recent_logs
                ]
        except Exception as e:
            logger.warning(f"Recent activities error: {e}")

        # Pending requests
        pending_requests = []
        try:
            my_requests = db.query(models.Approval).filter(
                models.Approval.requested_by == current_user.id
            ).order_by(models.Approval.created_at.desc()).limit(5).all()
            pending_requests = [
                {
                    "id": r.id,
                    "request_type": r.request_type,
                    "status": r.status,
                    "comments": r.comments,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in my_requests
            ]
        except Exception as e:
            logger.warning(f"Pending requests error: {e}")

        # Department specific operational metrics
        operational_metrics = {}
        if dept_name == "Inventory":
            movements = db.query(models.StockMovement).filter(
                (models.StockMovement.status == "PENDING") | (models.StockMovement.status == "IN_TRANSIT")
            ).limit(10).all()
            operational_metrics = {
                "pending_movements": [
                    {
                        "id": m.id,
                        "product_name": m.product.name if m.product else "Unknown",
                        "source": m.source_depot.name if m.source_depot else "Vendor",
                        "destination": m.destination_depot.name if m.destination_depot else "Discard",
                        "quantity": m.quantity,
                        "status": m.status,
                        "created_at": m.created_at.isoformat() if m.created_at else None
                    }
                    for m in movements
                ]
            }
        elif dept_name == "Procurement":
            suppliers = db.query(models.Supplier).limit(10).all()
            operational_metrics = {
                "suppliers": [
                    {"id": s.id, "name": s.name, "contact": s.contact_person, "rating": s.rating}
                    for s in suppliers
                ]
            }
        elif dept_name == "Sales":
            sales = db.query(models.Sale).order_by(models.Sale.sale_date.desc()).limit(10).all()
            operational_metrics = {
                "recent_sales": [
                    {
                        "id": s.id,
                        "product_name": s.product.name if s.product else "Unknown",
                        "quantity": s.quantity,
                        "total_amount": s.total_amount,
                        "sale_date": s.sale_date.isoformat() if s.sale_date else None
                    }
                    for s in sales
                ]
            }
        elif dept_name == "Logistics":
            movements = db.query(models.StockMovement).filter(models.StockMovement.status == "IN_TRANSIT").limit(10).all()
            operational_metrics = {
                "active_shipments": [
                    {
                        "id": m.id,
                        "product_name": m.product.name if m.product else "Unknown",
                        "source": m.source_depot.name if m.source_depot else "N/A",
                        "destination": m.destination_depot.name if m.destination_depot else "N/A",
                        "quantity": m.quantity,
                        "status": m.status
                    }
                    for m in movements
                ]
            }
        elif dept_name == "Finance":
            pos = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.status == "APPROVED").limit(10).all()
            operational_metrics = {
                "approved_invoices": [
                    {
                        "id": po.id,
                        "supplier_name": po.supplier.name if po.supplier else "Unknown",
                        "total_amount": po.total_amount,
                        "status": po.status,
                        "created_at": po.created_at.isoformat() if po.created_at else None
                    }
                    for po in pos
                ]
            }

        return {
            "username": current_user.username,
            "department_id": dept_id,
            "department_name": dept_name,
            "assigned_tasks": assigned_tasks,
            "tasks_pending": tasks_pending,
            "tasks_completed": tasks_completed,
            "tasks_in_progress": tasks_in_progress,
            "inventory_updates": inventory_updates,
            "notifications": notifications_data,
            "recent_activities": recent_activities,
            "pending_requests": pending_requests,
            "total_assigned_tasks": len(tasks),
            "operational_metrics": operational_metrics
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Employee dashboard error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Employee dashboard unavailable: {str(e)}")
