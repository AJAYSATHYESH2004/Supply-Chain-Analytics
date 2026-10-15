from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models import models

from app.core import security

router = APIRouter()

@router.get("/")
def read_suppliers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all suppliers"""
    suppliers = db.query(models.Supplier).offset(skip).limit(limit).all()
    return suppliers

@router.get("/{supplier_id}")
def read_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Get supplier by ID"""
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.post("/")
def create_supplier(
    supplier_data: dict, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN, models.UserRole.HOD, models.UserRole.MANAGER))
):
    """Create a new supplier"""
    db_supplier = models.Supplier(**supplier_data)
    db.add(db_supplier)
    db.flush()
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="CREATE",
        module="SUPPLIERS",
        details=f"Created supplier '{db_supplier.name}'."
    ))
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@router.put("/{supplier_id}")
def update_supplier(
    supplier_id: int, 
    supplier_data: dict, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN, models.UserRole.HOD, models.UserRole.MANAGER))
):
    """Update supplier details"""
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for key, value in supplier_data.items():
        setattr(supplier, key, value)
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="UPDATE",
        module="SUPPLIERS",
        details=f"Updated supplier ID {supplier_id} ('{supplier.name}')."
    ))
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN, models.UserRole.HOD, models.UserRole.MANAGER))
):
    """Delete a supplier"""
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    s_name = supplier.name
    db.delete(supplier)
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="DELETE",
        module="SUPPLIERS",
        details=f"Deleted supplier '{s_name}' (ID: {supplier_id})."
    ))
    db.commit()
    return {"detail": "Supplier deleted successfully"}

