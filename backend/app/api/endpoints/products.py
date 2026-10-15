from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models import models
from app.services.product_service import get_products, get_product, create_product, update_product, delete_product
from app.core.security import require_roles

router = APIRouter()

@router.get("/")
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _: models.User = Depends(require_roles("SUPER_ADMIN", "HOD", "MANAGER", "EMPLOYEE"))):
    products = get_products(db, skip=skip, limit=limit)
    return [
        {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "current_stock": p.current_stock,
            "reorder_level": p.reorder_level,
            "critical_threshold": p.critical_threshold,
            "image_url": p.image_url,
            "supplier_id": p.supplier_id,
            "department_id": p.department_id,
            "created_at": p.created_at
        }
        for p in products
    ]

@router.post("/")
def create_new_product(product_data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(require_roles("SUPER_ADMIN", "HOD", "MANAGER"))):
    p = create_product(db, product_data)
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="CREATE",
        module="PRODUCTS",
        details=f"Created product '{p.name}' with price {p.price}."
    ))
    db.commit()
    return {
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "price": p.price,
        "current_stock": p.current_stock,
        "reorder_level": p.reorder_level,
        "critical_threshold": p.critical_threshold,
        "image_url": p.image_url,
        "supplier_id": p.supplier_id,
        "department_id": p.department_id,
        "created_at": p.created_at
    }

@router.get("/{product_id}")
def read_product(product_id: int, db: Session = Depends(get_db), _: models.User = Depends(require_roles("SUPER_ADMIN", "HOD", "MANAGER", "EMPLOYEE"))):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "price": product.price,
        "current_stock": product.current_stock,
        "reorder_level": product.reorder_level,
        "critical_threshold": product.critical_threshold,
        "image_url": product.image_url,
        "supplier_id": product.supplier_id,
        "department_id": product.department_id,
        "created_at": product.created_at
    }

@router.put("/{product_id}")
def update_existing_product(product_id: int, product_data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(require_roles("SUPER_ADMIN", "HOD", "MANAGER"))):
    try:
        p = update_product(db, product_id, product_data)
        db.add(models.AuditLog(
            user_id=current_user.id,
            action="UPDATE",
            module="PRODUCTS",
            details=f"Updated product ID {product_id} ('{p.name}')."
        ))
        db.commit()
        return {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "current_stock": p.current_stock,
            "reorder_level": p.reorder_level,
            "critical_threshold": p.critical_threshold,
            "image_url": p.image_url,
            "supplier_id": p.supplier_id,
            "department_id": p.department_id,
            "created_at": p.created_at
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{product_id}")
def delete_existing_product(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_roles("SUPER_ADMIN", "HOD", "MANAGER"))):
    try:
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        p_name = product.name if product else f"#{product_id}"
        delete_product(db, product_id)
        db.add(models.AuditLog(
            user_id=current_user.id,
            action="DELETE",
            module="PRODUCTS",
            details=f"Deleted product '{p_name}' (ID: {product_id})."
        ))
        db.commit()
        return {"detail": "Product deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

