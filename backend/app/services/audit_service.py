from sqlalchemy.orm import Session
from app.models import models
from datetime import datetime, timedelta

class AuditService:
    @staticmethod
    def log_action(
        db: Session, 
        user_id: int, 
        action: str, 
        module: str, 
        details: str = None, 
        ip_address: str = None
    ):
        """
        Log an administrative or system-critical action.
        """
        log = models.AuditLog(
            user_id=user_id,
            action=action,
            module=module,
            details=details,
            ip_address=ip_address
        )
        db.add(log)
        db.commit()
        return log

    @staticmethod
    def get_logs(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_filtered_logs_query(
        db: Session,
        user_id: int = None,
        department_id: int = None,
        start_date: str = None,
        end_date: str = None,
        action_type: str = None
    ):
        query = db.query(models.AuditLog)
        
        if user_id is not None:
            query = query.filter(models.AuditLog.user_id == user_id)
            
        if department_id is not None:
            query = query.join(models.User, models.AuditLog.user_id == models.User.id)\
                         .filter(models.User.department_id == department_id)
                         
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(models.AuditLog.timestamp >= start_dt)
            except ValueError:
                pass
                
        if end_date:
            try:
                # Include the whole day
                end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                query = query.filter(models.AuditLog.timestamp < end_dt)
            except ValueError:
                pass
                
        if action_type:
            query = query.filter(models.AuditLog.action == action_type)
            
        return query.order_by(models.AuditLog.timestamp.desc())
