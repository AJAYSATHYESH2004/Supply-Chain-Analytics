from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    hod_id: Optional[int] = None
    manager_id: Optional[int] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    hod_id: Optional[int] = None
    manager_id: Optional[int] = None

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
