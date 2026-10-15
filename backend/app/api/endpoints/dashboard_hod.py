from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models import models
from app.core.security import require_roles
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=dict)
def hod_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("HOD", "SUPER_ADMIN"))
):
    try:
        total_products  = db.query(models.Product).count()
        total_suppliers = db.query(models.Supplier).count()

        total = db.query(models.Product).count() or 1
        healthy = db.query(models.Product).filter(
            models.Product.current_stock > models.Product.critical_threshold
        ).count()
        inventory_health_score = round((healthy / total) * 100, 1)

        monthly_revenue = db.query(func.sum(models.Sale.total_amount)).scalar() or 0

        pending_approvals = 0
        critical_alerts = 0
        try:
            pending_approvals = db.query(models.Approval).filter(
                models.Approval.status == models.ApprovalStatus.PENDING
            ).count()
            critical_alerts = pending_approvals
        except Exception:
            pass

        departments = db.query(models.Department).all()
        department_performance = []
        for dept in departments:
            try:
                user_ids = [
                    u.id for u in db.query(models.User).filter(
                        models.User.department_id == dept.id
                    ).all()
                ]
                dept_products = db.query(models.Product).filter(
                    models.Product.department_id == dept.id
                ).all()
                dept_product_ids = [p.id for p in dept_products]
                dept_revenue = 0
                if dept_product_ids:
                    dept_revenue = db.query(func.sum(models.Sale.total_amount)).filter(
                        models.Sale.product_id.in_(dept_product_ids)
                    ).scalar() or 0

                low_stock = db.query(models.Product).filter(
                    models.Product.department_id == dept.id,
                    models.Product.current_stock <= models.Product.reorder_level
                ).count()

                pending_tasks = 0
                if user_ids:
                    pending_tasks = db.query(models.Task).filter(
                        models.Task.assigned_to.in_(user_ids),
                        models.Task.status == models.TaskStatus.PENDING
                    ).count()

                department_performance.append({
                    "id": dept.id,
                    "name": dept.name,
                    "staff_count": len(user_ids),
                    "product_count": len(dept_products),
                    "revenue": round(float(dept_revenue), 2),
                    "low_stock_items": low_stock,
                    "pending_tasks": pending_tasks,
                })
            except Exception as e:
                logger.warning(f"Dept performance error for dept {dept.id}: {e}")

        suppliers = db.query(models.Supplier).all()
        supplier_performance = []
        for s in suppliers:
            try:
                on_time = s.on_time_deliveries or 0
                late = s.late_deliveries or 0
                supplier_performance.append({
                    "id": s.id,
                    "name": s.name,
                    "rating": s.rating,
                    "on_time_deliveries": on_time,
                    "late_deliveries": late,
                    "avg_delivery_time": s.avg_delivery_time,
                    "on_time_rate": round(on_time / max(on_time + late, 1) * 100, 1),
                })
            except Exception as e:
                logger.warning(f"Supplier perf error for supplier {s.id}: {e}")

        demand_forecast_summary = []
        try:
            forecasts = db.query(models.Forecast).filter(
                models.Forecast.period == "MONTHLY"
            ).order_by(models.Forecast.predicted_demand.desc()).limit(5).all()
            demand_forecast_summary = [
                {
                    "product_id": f.product_id,
                    "period": f.period,
                    "predicted_demand": f.predicted_demand,
                    "confidence_score": f.confidence_score,
                }
                for f in forecasts
            ]
        except Exception as e:
            logger.warning(f"Forecast summary error: {e}")

        low_stock_products = db.query(models.Product).filter(
            models.Product.current_stock <= models.Product.reorder_level
        ).order_by(models.Product.current_stock.asc()).limit(10).all()
        low_stock_list = [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "current_stock": p.current_stock,
                "reorder_level": p.reorder_level,
                "critical_threshold": p.critical_threshold,
            }
            for p in low_stock_products
        ]

        approvals_data = []
        try:
            pending_approval_list = db.query(models.Approval).filter(
                models.Approval.status == models.ApprovalStatus.PENDING
            ).order_by(models.Approval.created_at.desc()).limit(5).all()
            approvals_data = [
                {
                    "id": a.id,
                    "request_type": a.request_type,
                    "requested_by": a.requested_by,
                    "status": a.status,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in pending_approval_list
            ]
        except Exception as e:
            logger.warning(f"Approvals list error: {e}")

        return {
            "total_products": total_products,
            "inventory_health_score": inventory_health_score,
            "total_suppliers": total_suppliers,
            "monthly_revenue": round(float(monthly_revenue), 2),
            "pending_approvals": pending_approvals,
            "critical_alerts": critical_alerts,
            "department_performance": department_performance,
            "supplier_performance": supplier_performance,
            "demand_forecast_summary": demand_forecast_summary,
            "low_stock_products": low_stock_list,
            "pending_approval_list": approvals_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"HOD dashboard error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"HOD dashboard unavailable: {str(e)}")
