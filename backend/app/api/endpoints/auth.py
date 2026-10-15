from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
from typing import List

from app.db.session import get_db
from app.models import models
from app.schemas import auth as auth_schema
from app.core import security
from app.core.config import settings

router = APIRouter()

MAX_FAILED_ATTEMPTS = 5

@router.post("/login", response_model=auth_schema.Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Find account
    account = db.query(models.UserAccount).filter(models.UserAccount.username == form_data.username).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    # Check if active
    if not account.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    
    # Check for lockout
    if account.failed_attempts >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account locked due to multiple failed attempts. Please contact support.",
        )

    # Verify password
    if not security.verify_password(form_data.password, account.password_hash):
        account.failed_attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    # Success - Reset failed attempts
    account.failed_attempts = 0
    account.last_login = datetime.utcnow()
    
    # Log activity
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "unknown")
    login_activity = models.LoginActivity(
        account_id=account.account_id,
        ip_address=client_ip,
        device_info=user_agent
    )
    db.add(login_activity)
    db.add(models.AuditLog(
        user_id=account.user_id,
        action="LOGIN",
        module="AUTH",
        details=f"User {account.username} logged in successfully from IP {client_ip}",
        ip_address=client_ip
    ))
    db.commit()
    
    # Create tokens
    access_token = security.create_access_token(data={"sub": str(account.user_id)})
    refresh_token = security.create_refresh_token(data={"sub": str(account.user_id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": account.user_id,
        "username": account.username,
        "email": account.email,
        "role": account.role,
        "department_name": account.user.department.name if account.user and account.user.department else "Corporate",
    }

@router.post("/refresh", response_model=auth_schema.Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    try:
        from jose import jwt
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        if payload.get("type") != "refresh":
             raise HTTPException(status_code=401, detail="Invalid refresh token")
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user or not user.account.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    access_token = security.create_access_token(data={"sub": str(user.id)})
    new_refresh_token = security.create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.account.role,
        "department_name": user.department.name if user.department else "Corporate",
    }

@router.post("/signup-request", response_model=auth_schema.SignupRequestResponse)
def create_signup_request(request_data: auth_schema.SignupRequestCreate, db: Session = Depends(get_db)):
    # Check if email/username already exists
    if db.query(models.UserAccount).filter(models.UserAccount.email == request_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    signup_req = models.SignupRequest(
        full_name=request_data.full_name,
        email=request_data.email,
        phone=request_data.phone,
        requested_role=request_data.requested_role,
        status=models.SignupRequestStatus.PENDING
    )
    db.add(signup_req)
    db.commit()
    db.refresh(signup_req)
    return signup_req

@router.post("/logout")
def logout(current_user: models.User = Depends(security.get_current_user), db: Session = Depends(get_db)):
    # In a simple JWT setup, logout is handled client-side by deleting the token.
    # Optionally, we can blacklist the token or update the latest login activity.
    activity = db.query(models.LoginActivity).filter(
        models.LoginActivity.account_id == current_user.account.account_id
    ).order_by(models.LoginActivity.login_time.desc()).first()
    
    if activity:
        activity.logout_time = datetime.utcnow()
        
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="LOGOUT",
        module="AUTH",
        details=f"User {current_user.username} logged out successfully"
    ))
    db.commit()
        
    return {"detail": "Successfully logged out"}

@router.post("/forgot-password")
def forgot_password(reset_req: auth_schema.PasswordResetRequest, db: Session = Depends(get_db)):
    account = db.query(models.UserAccount).filter(models.UserAccount.email == reset_req.email).first()
    if not account:
        # Don't reveal if email exists or not
        return {"detail": "If your email is registered, you will receive a reset link."}
    
    # In a real app, generate a token, save it, and send an email
    reset_token = str(uuid.uuid4())
    print(f"DEBUG: Password reset token for {reset_req.email}: {reset_token}")
    
    return {"detail": "If your email is registered, you will receive a reset link."}

@router.post("/reset-password")
def reset_password(reset_data: auth_schema.PasswordResetConfirm, db: Session = Depends(get_db)):
    # Mock validation of token
    if not reset_data.token or len(reset_data.token) < 10:
         raise HTTPException(status_code=400, detail="Invalid or expired token")
         
    # In a real app, find the user by token
    # For now, let's assume it's valid if provided (MOCK)
    return {"detail": "Password has been reset successfully."}

@router.post("/change-password")
def change_password(
    password_data: auth_schema.PasswordChange,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    account = current_user.account
    if not security.verify_password(password_data.old_password, account.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    account.password_hash = security.get_password_hash(password_data.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}

@router.get("/me", response_model=auth_schema.UserResponse)
def get_me(current_user: models.User = Depends(security.get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.account.role if current_user.account else "EMPLOYEE",
        "department_id": current_user.department_id,
        "department_name": current_user.department.name if current_user.department else "Corporate",
    }

@router.get("/users", response_model=List[auth_schema.UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN, models.UserRole.HOD))
):
    users = db.query(models.User).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.account.role if u.account else "EMPLOYEE",
            "department_id": u.department_id,
            "department_name": u.department.name if u.department else "Corporate"
        })
    return result

@router.post("/users")
def create_new_user(
    user_data: dict, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN))
):
    # Check if user already exists
    existing = db.query(models.UserAccount).filter(
        (models.UserAccount.username == user_data["username"]) |
        (models.UserAccount.email == user_data["email"])
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    hashed = security.get_password_hash(user_data.get("password", "password123"))
    user = models.User(
        username=user_data["username"],
        email=user_data["email"],
        hashed_password=hashed,
        role=user_data.get("role", "EMPLOYEE"),
        department_id=user_data.get("department_id")
    )
    db.add(user)
    db.flush()
    
    account = models.UserAccount(
        user_id=user.id,
        username=user_data["username"],
        email=user_data["email"],
        password_hash=hashed,
        role=user_data.get("role", "EMPLOYEE"),
        is_active=1
    )
    db.add(account)
    
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="CREATE",
        module="USER",
        details=f"Created user {user.username} with role {user.role}"
    ))
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "department_id": user.department_id,
        "department_name": user.department.name if user.department else "Corporate"
    }

@router.put("/users/{user_id}")
def update_user(
    user_id: int, 
    user_data: dict, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    if current_user.id != user_id and current_user.account.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to edit this user's profile")

    # Restrict: managers & staff cannot modify roles/departments of other users (or at all if not admin)
    if current_user.account.role != models.UserRole.SUPER_ADMIN:
        if "role" in user_data or "department_id" in user_data:
            raise HTTPException(status_code=403, detail="Only Admins can modify roles or departments")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    account = db.query(models.UserAccount).filter(models.UserAccount.user_id == user_id).first()
    
    # Update user properties
    if "username" in user_data:
        user.username = user_data["username"]
        if account:
            account.username = user_data["username"]
    if "email" in user_data:
        user.email = user_data["email"]
        if account:
            account.email = user_data["email"]
    if "role" in user_data:
        user.role = user_data["role"]
        if account:
            account.role = user_data["role"]
    if "department_id" in user_data:
        user.department_id = user_data["department_id"]
    if "password" in user_data and user_data["password"]:
        hashed = security.get_password_hash(user_data["password"])
        user.hashed_password = hashed
        if account:
            account.password_hash = hashed
            
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="UPDATE",
        module="USER",
        details=f"Updated profile for user ID {user.id} ({user.username})"
    ))
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "department_id": user.department_id,
        "department_name": user.department.name if user.department else "Corporate"
    }

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Delete related accounts first
    db.query(models.UserAccount).filter(models.UserAccount.user_id == user_id).delete()
    db.delete(user)
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="DELETE",
        module="USER",
        details=f"Deleted user ID {user_id} ({user.username})"
    ))
    db.commit()
    return {"detail": "User deleted successfully"}

@router.get("/signup-requests")
def get_signup_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    if current_user.account.role not in [models.UserRole.SUPER_ADMIN, models.UserRole.HOD]:
        raise HTTPException(status_code=403, detail="Not authorized to view user creation requests")
        
    requests = db.query(models.SignupRequest).order_by(models.SignupRequest.created_at.desc()).all()
    res = []
    for r in requests:
        req_by_name = r.requested_by.username if r.requested_by else "Guest"
        dept_name = r.department.name if r.department else "Unassigned"
        res.append({
            "request_id": r.request_id,
            "full_name": r.full_name,
            "email": r.email,
            "phone": r.phone,
            "requested_role": r.requested_role,
            "status": r.status,
            "created_at": r.created_at,
            "requested_by": req_by_name,
            "department": dept_name,
            "department_id": r.department_id
        })
    return res

@router.post("/signup-requests")
def create_user_creation_request(
    req_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Check if user already exists
    existing = db.query(models.UserAccount).filter(
        (models.UserAccount.username == req_data["username"]) |
        (models.UserAccount.email == req_data["email"])
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
        
    signup_req = models.SignupRequest(
        full_name=req_data["username"],
        email=req_data["email"],
        phone=req_data.get("phone", ""),
        requested_role=req_data.get("role", models.UserRole.EMPLOYEE),
        status=models.SignupRequestStatus.PENDING,
        requested_by_id=current_user.id,
        department_id=req_data.get("department_id")
    )
    db.add(signup_req)
    db.commit()
    db.refresh(signup_req)
    return {"detail": "User creation request submitted successfully", "request_id": signup_req.request_id}

@router.post("/signup-requests/{request_id}/approve")
def approve_signup_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    if current_user.account.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Admins can approve user requests")
        
    req = db.query(models.SignupRequest).filter(models.SignupRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != models.SignupRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is already processed")
        
    # Check if user already exists
    existing = db.query(models.UserAccount).filter(
        (models.UserAccount.username == req.full_name) |
        (models.UserAccount.email == req.email)
    ).first()
    if existing:
        req.status = models.SignupRequestStatus.REJECTED
        db.commit()
        raise HTTPException(status_code=400, detail="Username or email already exists. Request rejected.")
        
    # Create the user and user account
    hashed = security.get_password_hash("password123")  # default password
    user = models.User(
        username=req.full_name,
        email=req.email,
        hashed_password=hashed,
        role=req.requested_role,
        department_id=req.department_id
    )
    db.add(user)
    db.flush()
    
    account = models.UserAccount(
        user_id=user.id,
        username=req.full_name,
        email=req.email,
        password_hash=hashed,
        role=req.requested_role,
        is_active=1
    )
    db.add(account)
    
    req.status = models.SignupRequestStatus.APPROVED
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="APPROVE_USER",
        module="AUTH",
        details=f"Approved signup request ID {req.request_id} for user {req.full_name}."
    ))
    
    db.commit()
    return {"detail": f"User account for {req.full_name} created successfully"}

@router.post("/signup-requests/{request_id}/reject")
def reject_signup_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    if current_user.account.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Admins can reject user requests")
        
    req = db.query(models.SignupRequest).filter(models.SignupRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != models.SignupRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is already processed")
        
    req.status = models.SignupRequestStatus.REJECTED
    
    # Audit log
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="REJECT_USER",
        module="AUTH",
        details=f"Rejected signup request ID {req.request_id} for user {req.full_name}."
    ))
    
    db.commit()
    return {"detail": "Signup request rejected"}
