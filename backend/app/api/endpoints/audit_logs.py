from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models import models
from app.services.audit_service import AuditService
from app.core import security
import pandas as pd
from app.services.report_service import df_to_format

router = APIRouter()

@router.get("/")
def get_audit_logs(
    user_id: Optional[int] = None,
    department_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    action_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Only admins can view audit logs
    if current_user.account.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to view audit logs")
        
    query = AuditService.get_filtered_logs_query(
        db, user_id, department_id, start_date, end_date, action_type
    )
    logs = query.offset(skip).limit(limit).all()
    
    # Map operator username and department name for frontend
    res = []
    for log in logs:
        op_name = log.user.username if log.user else f"User #{log.user_id}"
        dept_name = log.user.department.name if log.user and log.user.department else "Corporate"
        res.append({
            "id": log.id,
            "user_id": log.user_id,
            "operator_name": op_name,
            "department": dept_name,
            "action": log.action,
            "module": log.module,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp
        })
    return res

@router.get("/export")
def export_audit_logs(
    format: str = "csv",
    user_id: Optional[int] = None,
    department_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    action_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    if current_user.account.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to export audit logs")
        
    query = AuditService.get_filtered_logs_query(
        db, user_id, department_id, start_date, end_date, action_type
    )
    logs = query.all()
    
    data = []
    for log in logs:
        op_name = log.user.username if log.user else f"User #{log.user_id}"
        dept_name = log.user.department.name if log.user and log.user.department else "Corporate"
        data.append({
            "Log ID": log.id,
            "Operator": op_name,
            "Department": dept_name,
            "Action": log.action,
            "Module": log.module,
            "Details": log.details,
            "IP Address": log.ip_address or "N/A",
            "Timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "N/A"
        })
        
    df = pd.DataFrame(data) if data else pd.DataFrame(columns=["Log ID", "Operator", "Department", "Action", "Module", "Details", "IP Address", "Timestamp"])
    
    content = df_to_format(df, format, "System Audit Logs Trail")
    
    if format == "csv":
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=audit_logs.csv"}
        )
    elif format == "excel":
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=audit_logs.xlsx"}
        )
    elif format == "pdf":
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=audit_logs.pdf"}
        )
    return Response(content="Invalid Format", status_code=400)
