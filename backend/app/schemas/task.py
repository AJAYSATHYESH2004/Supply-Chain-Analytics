from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.models import TaskStatus

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: int
    priority: str = "MEDIUM"
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    status: Optional[TaskStatus] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: int
    status: TaskStatus
    created_at: datetime

    class Config:
        from_attributes = True
