from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models import models
from sqlalchemy import func

from app.core import security

router = APIRouter()

@router.get("/")
def read_sales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all sales records"""
    sales = db.query(models.Sale).offset(skip).limit(limit).all()
    return sales

@router.get("/stats")
def get_sales_stats(db: Session = Depends(get_db)):
    """Get sales statistics"""
    total_sales = db.query(func.sum(models.Sale.total_amount)).scalar() or 0
    total_orders = db.query(func.count(models.Sale.id)).scalar() or 0
    avg_order_value = total_sales / total_orders if total_orders > 0 else 0
    
    return {
        "total_sales": float(total_sales),
        "total_orders": int(total_orders),
        "average_order_value": float(avg_order_value)
    }

@router.post("/")
def create_sale(
    sale_data: dict, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Create a new sale, deduct product stock, and log transaction"""
    product = db.query(models.Product).filter(models.Product.id == sale_data["product_id"]).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.current_stock < sale_data["quantity"]:
        raise HTTPException(status_code=400, detail=f"Insufficient stock. Current stock is {product.current_stock}")
        
    product.current_stock -= sale_data["quantity"]
    
    if "sale_date" in sale_data and isinstance(sale_data["sale_date"], str):
        from datetime import datetime
        try:
            date_str = sale_data["sale_date"].replace("Z", "+00:00")
            sale_data["sale_date"] = datetime.fromisoformat(date_str)
        except Exception:
            sale_data["sale_date"] = datetime.now()
            
    db_sale = models.Sale(**sale_data)
    db.add(db_sale)
    db.flush() # Get sale ID
    
    db_transaction = models.InventoryTransaction(
        product_id=product.id,
        transaction_type="OUT",
        quantity=sale_data["quantity"],
        reason=f"Sale order #{db_sale.id}"
    )
    db.add(db_transaction)
    
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="CREATE",
        module="SALES",
        details=f"Created sales order #{db_sale.id} for {db_sale.quantity} units of '{product.name}'."
    ))
    
    db.commit()
    db.refresh(db_sale)
    return db_sale

