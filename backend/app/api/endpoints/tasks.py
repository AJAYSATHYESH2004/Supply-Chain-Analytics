from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models import models
from app.schemas import task as schemas
from app.core import security

router = APIRouter()

@router.get("/", response_model=List[schemas.TaskResponse])
def get_tasks(
    assigned_to: Optional[int] = None,
    status: Optional[models.TaskStatus] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    query = db.query(models.Task)
    
    # Apply RBAC filters
    if current_user.role == models.UserRole.EMPLOYEE:
        query = query.filter(models.Task.assigned_to == current_user.id)
    elif current_user.role == models.UserRole.MANAGER:
        # Managers can see tasks assigned to staff in their department or themselves
        dept_user_ids = [u.id for u in db.query(models.User).filter(models.User.department_id == current_user.department_id).all()]
        query = query.filter(models.Task.assigned_to.in_(dept_user_ids))
    
    if assigned_to:
        if current_user.role == models.UserRole.EMPLOYEE and assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view tasks of other users")
        elif current_user.role == models.UserRole.MANAGER:
            target_user = db.query(models.User).filter(models.User.id == assigned_to).first()
            if not target_user or target_user.department_id != current_user.department_id:
                raise HTTPException(status_code=403, detail="Not authorized to view tasks outside your department")
        query = query.filter(models.Task.assigned_to == assigned_to)
        
    if status:
        query = query.filter(models.Task.status == status)
    return query.all()

@router.post("/", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task: schemas.TaskCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN, models.UserRole.HOD, models.UserRole.MANAGER))
):
    # Enforce department restriction for managers
    if current_user.role == models.UserRole.MANAGER:
        assignee = db.query(models.User).filter(models.User.id == task.assigned_to).first()
        if not assignee or assignee.department_id != current_user.department_id:
            raise HTTPException(
                status_code=403, 
                detail="Managers can only assign tasks to staff within their own department"
            )
            
    new_task = models.Task(**task.dict())
    db.add(new_task)
    db.flush()
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="CREATE",
        module="TASKS",
        details=f"Created task '{new_task.title}' assigned to user ID {new_task.assigned_to}."
    ))
    db.commit()
    db.refresh(new_task)
    
    # Trigger notification
    from app.services.notification_service import create_notification
    try:
        create_notification(
            db,
            user_id=new_task.assigned_to,
            title="Task Assigned",
            message=f"You have been assigned a new task: {new_task.title}",
            type="TASK_ASSIGNED"
        )
    except Exception as e:
        print(f"Error creating task notification: {e}")
        
    return new_task

@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Check permissions
    if current_user.role == models.UserRole.EMPLOYEE and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    elif current_user.role == models.UserRole.MANAGER:
        assignee = db.query(models.User).filter(models.User.id == task.assigned_to).first()
        if not assignee or assignee.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Not authorized to view tasks outside your department")
            
    return task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int, 
    task_update: schemas.TaskUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Enforce role-based restrictions
    if current_user.role == models.UserRole.EMPLOYEE:
        if db_task.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="You can only update your own tasks")
        
        # Employees can ONLY update status
        update_data = task_update.dict(exclude_unset=True)
        if any(key != "status" for key in update_data.keys()):
            raise HTTPException(status_code=403, detail="Staff members can only update task status")
            
    elif current_user.role == models.UserRole.MANAGER:
        # Check that original assignee is in manager's department
        assignee = db.query(models.User).filter(models.User.id == db_task.assigned_to).first()
        if not assignee or assignee.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Managers can only update tasks within their department")
            
        # Check that target assignee is also in manager's department (if reassigning)
        update_data = task_update.dict(exclude_unset=True)
        if "assigned_to" in update_data:
            target_assignee_id = update_data["assigned_to"]
            target_assignee = db.query(models.User).filter(models.User.id == target_assignee_id).first()
            if not target_assignee or target_assignee.department_id != current_user.department_id:
                raise HTTPException(status_code=403, detail="Managers can only reassign tasks to staff within their department")
                
    old_assignee = db_task.assigned_to
    old_status = db_task.status
    
    for key, value in task_update.dict(exclude_unset=True).items():
        setattr(db_task, key, value)
        
    reassigned = db_task.assigned_to != old_assignee
    status_changed = db_task.status != old_status
    
    log_details = f"Updated task '{db_task.title}'."
    if reassigned:
        log_details += f" Reassigned from user ID {old_assignee} to {db_task.assigned_to}."
    if status_changed:
        log_details += f" Status changed from {old_status} to {db_task.status}."
        
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="UPDATE",
        module="TASKS",
        details=log_details
    ))
    db.commit()
    db.refresh(db_task)
    
    # Trigger notification on reassignment
    if reassigned:
        from app.services.notification_service import create_notification
        try:
            create_notification(
                db,
                user_id=db_task.assigned_to,
                title="Task Assigned",
                message=f"You have been assigned a new task: {db_task.title}",
                type="TASK_ASSIGNED"
            )
        except Exception as e:
            print(f"Error creating reassigned task notification: {e}")
            
    return db_task

@router.delete("/{task_id}")
def delete_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN, models.UserRole.HOD, models.UserRole.MANAGER))
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user.role == models.UserRole.MANAGER:
        assignee = db.query(models.User).filter(models.User.id == task.assigned_to).first()
        if not assignee or assignee.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Managers can only delete tasks within their own department")
            
    title = task.title
    db.delete(task)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="DELETE",
        module="TASKS",
        details=f"Deleted task '{title}'."
    ))
    db.commit()
    return {"detail": "Task deleted"}
