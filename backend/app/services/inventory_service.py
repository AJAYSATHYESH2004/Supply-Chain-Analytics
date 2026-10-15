from sqlalchemy.orm import Session
from app.models import models
from typing import List, Optional

def get_inventory_transactions(db: Session, skip: int = 0, limit: int = 100) -> List[models.InventoryTransaction]:
    return db.query(models.InventoryTransaction).offset(skip).limit(limit).all()

def get_inventory_transaction(db: Session, transaction_id: int) -> Optional[models.InventoryTransaction]:
    return db.query(models.InventoryTransaction).filter(models.InventoryTransaction.id == transaction_id).first()

def create_inventory_transaction(db: Session, data: dict) -> models.InventoryTransaction:
    transaction = models.InventoryTransaction(**data)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

def update_inventory_transaction(db: Session, transaction_id: int, updates: dict) -> models.InventoryTransaction:
    transaction = get_inventory_transaction(db, transaction_id)
    if not transaction:
        raise ValueError("Transaction not found")
    for key, value in updates.items():
        setattr(transaction, key, value)
    db.commit()
    db.refresh(transaction)
    return transaction

def delete_inventory_transaction(db: Session, transaction_id: int) -> None:
    transaction = get_inventory_transaction(db, transaction_id)
    if not transaction:
        raise ValueError("Transaction not found")
    db.delete(transaction)
    db.commit()
