from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.report_service import ReportService
from app.core import security
from app.models import models

router = APIRouter()

def create_report_response(content: bytes, format: str, filename_prefix: str):
    if format == "csv":
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename_prefix}.csv"}
        )
    elif format == "excel":
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename_prefix}.xlsx"}
        )
    elif format == "pdf":
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename_prefix}.pdf"}
        )
    return Response(content="Invalid Format", status_code=400)

@router.get("/inventory")
def download_inventory_report(
    format: str = "csv", 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    content = ReportService.generate_inventory_report(db, format)
    return create_report_response(content, format, "inventory_report")

@router.get("/sales")
def download_sales_report(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    content = ReportService.generate_sales_report(db, format)
    return create_report_response(content, format, "sales_report")

@router.get("/inventory-utilization")
def download_inventory_utilization_report(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    content = ReportService.generate_inventory_utilization_report(db, format)
    return create_report_response(content, format, "inventory_utilization_report")

@router.get("/surplus-inventory")
def download_surplus_inventory_report(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    content = ReportService.generate_surplus_inventory_report(db, format)
    return create_report_response(content, format, "surplus_inventory_report")

@router.get("/deficit-inventory")
def download_deficit_inventory_report(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    content = ReportService.generate_deficit_inventory_report(db, format)
    return create_report_response(content, format, "deficit_inventory_report")

@router.get("/transfer-recommendations")
def download_transfer_recommendations_report(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    content = ReportService.generate_transfer_recommendations_report(db, format)
    return create_report_response(content, format, "transfer_recommendations_report")

@router.get("/production-avoidance")
def download_production_avoidance_report(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    content = ReportService.generate_production_avoidance_report(db, format)
    return create_report_response(content, format, "production_avoidance_report")

@router.get("/cost-savings")
def download_cost_savings_report(
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    content = ReportService.generate_cost_savings_report(db, format)
    return create_report_response(content, format, "cost_savings_report")
