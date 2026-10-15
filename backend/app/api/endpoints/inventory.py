from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import models

router = APIRouter()

@router.get("/status")
def get_inventory_status(db: Session = Depends(get_db)):
    """Get inventory status summary"""
    products = db.query(models.Product).all()
    
    total_stock = sum(p.current_stock for p in products)
    low_stock = sum(1 for p in products if p.current_stock <= p.critical_threshold)
    healthy = sum(1 for p in products if p.current_stock > p.critical_threshold)
    
    return {
        "total_stock": total_stock,
        "low_stock_items": low_stock,
        "healthy_items": healthy,
        "total_products": len(products)
    }

@router.get("/low-stock")
def get_low_stock_items(db: Session = Depends(get_db)):
    """Get items with low stock"""
    low_stock = db.query(models.Product).filter(
        models.Product.current_stock <= models.Product.critical_threshold
    ).all()
    return low_stock

@router.get("/transactions")
def get_inventory_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get inventory transactions"""
    transactions = db.query(models.InventoryTransaction).order_by(
        models.InventoryTransaction.timestamp.desc()
    ).offset(skip).limit(limit).all()
    return transactions

@router.post("/transactions")
def create_inventory_transaction(transaction_data: dict, db: Session = Depends(get_db)):
    """Create a new inventory transaction and adjust product stock level"""
    product = db.query(models.Product).filter(models.Product.id == transaction_data["product_id"]).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    qty = transaction_data["quantity"]
    t_type = transaction_data["transaction_type"] # IN, OUT, ADJUSTMENT
    
    if t_type == "OUT":
        if product.current_stock < qty:
            raise HTTPException(status_code=400, detail="Insufficient stock for this transaction")
        product.current_stock -= qty
    elif t_type == "IN":
        product.current_stock += qty
    elif t_type == "ADJUSTMENT":
        if product.current_stock + qty < 0:
             raise HTTPException(status_code=400, detail="Stock adjustment would result in negative stock")
        product.current_stock += qty
        
    db_transaction = models.InventoryTransaction(
        product_id=product.id,
        transaction_type=t_type,
        quantity=qty,
        reason=transaction_data.get("reason", "")
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction
