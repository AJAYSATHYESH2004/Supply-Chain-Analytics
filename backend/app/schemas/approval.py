from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.models import ApprovalStatus

class ApprovalBase(BaseModel):
    request_type: str
    request_id: int
    requested_by: int
    comments: Optional[str] = None

class ApprovalCreate(ApprovalBase):
    pass

class ApprovalUpdate(BaseModel):
    approved_by: Optional[int] = None
    status: Optional[ApprovalStatus] = None
    comments: Optional[str] = None

class ApprovalResponse(ApprovalBase):
    id: int
    approved_by: Optional[int] = None
    status: ApprovalStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
