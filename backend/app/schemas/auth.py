from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, SignupRequestStatus

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user_id: int
    username: str
    email: str
    role: str
    department_name: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserLogin(BaseModel):
    username: str
    password: str
    remember_me: bool = False

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.EMPLOYEE
    department_id: Optional[int] = None

class SignupRequestCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    requested_role: UserRole

class SignupRequestResponse(BaseModel):
    request_id: int
    full_name: str
    email: str
    phone: str
    requested_role: UserRole
    status: SignupRequestStatus
    created_at: datetime

    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None

    class Config:
        from_attributes = True
