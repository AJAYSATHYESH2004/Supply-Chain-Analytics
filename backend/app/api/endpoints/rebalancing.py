from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
from app.db.session import get_db
from app.models import models
from app.schemas import rebalancing as schemas
from app.services.rebalancing_service import run_rebalancing_calculations, get_distance_and_cost
from app.services.forecasting_service import run_demand_forecasting
from datetime import datetime
from app.core import security

router = APIRouter()

# ─────────────────────────────────────────────────────────────
# STATES
# ─────────────────────────────────────────────────────────────

@router.get("/states", response_model=List[schemas.StateResponse])
def get_states(db: Session = Depends(get_db)):
    return db.query(models.State).all()

@router.post("/states", response_model=schemas.StateResponse, status_code=status.HTTP_201_CREATED)
def create_state(
    state: schemas.StateCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN))
):
    existing = db.query(models.State).filter(models.State.name == state.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="State already exists")
    new_state = models.State(**state.dict())
    db.add(new_state)
    db.commit()
    db.refresh(new_state)
    return new_state

@router.delete("/states/{state_id}")
def delete_state(
    state_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN))
):
    state = db.query(models.State).filter(models.State.id == state_id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    db.delete(state)
    db.commit()
    return {"detail": "State deleted"}

# ─────────────────────────────────────────────────────────────
# DEPOTS
# ─────────────────────────────────────────────────────────────

@router.get("/depots", response_model=List[schemas.DepotResponse])
def get_depots(db: Session = Depends(get_db)):
    depots = db.query(models.Depot).all()
    res = []
    for d in depots:
        state_name = d.state.name if d.state else "Unknown"
        res.append(schemas.DepotResponse(
            id=d.id,
            name=d.name,
            state_id=d.state_id,
            address=d.address,
            capacity=d.capacity,
            latitude=d.latitude,
            longitude=d.longitude,
            state_name=state_name
        ))
    return res

@router.post("/depots", response_model=schemas.DepotResponse, status_code=status.HTTP_201_CREATED)
def create_depot(
    depot: schemas.DepotCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN))
):
    existing = db.query(models.Depot).filter(models.Depot.name == depot.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Depot already exists")
    new_depot = models.Depot(**depot.dict())
    db.add(new_depot)
    db.commit()
    db.refresh(new_depot)
    
    # Initialize inventory records for this depot with all existing products with 0 stock
    products = db.query(models.Product).all()
    for p in products:
        db.add(models.Inventory(
            depot_id=new_depot.id,
            product_id=p.id,
            current_stock=0,
            reorder_level=50,
            critical_threshold=20
        ))
    db.commit()
    
    state_name = new_depot.state.name if new_depot.state else "Unknown"
    return schemas.DepotResponse(
        id=new_depot.id,
        name=new_depot.name,
        state_id=new_depot.state_id,
        address=new_depot.address,
        capacity=new_depot.capacity,
        latitude=new_depot.latitude,
        longitude=new_depot.longitude,
        state_name=state_name
    )

@router.delete("/depots/{depot_id}")
def delete_depot(
    depot_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN))
):
    depot = db.query(models.Depot).filter(models.Depot.id == depot_id).first()
    if not depot:
        raise HTTPException(status_code=404, detail="Depot not found")
    
    # Cascade delete inventory associated with this depot
    db.query(models.Inventory).filter(models.Inventory.depot_id == depot_id).delete()
    db.delete(depot)
    db.commit()
    return {"detail": "Depot deleted"}

# ─────────────────────────────────────────────────────────────
# DEPOT INVENTORY
# ─────────────────────────────────────────────────────────────

@router.get("/depots/{depot_id}/inventory", response_model=List[schemas.InventoryResponse])
def get_depot_inventory(depot_id: int, db: Session = Depends(get_db)):
    items = db.query(models.Inventory).filter(models.Inventory.depot_id == depot_id).all()
    res = []
    for item in items:
        res.append(schemas.InventoryResponse(
            id=item.id,
            depot_id=item.depot_id,
            product_id=item.product_id,
            current_stock=item.current_stock,
            reorder_level=item.reorder_level,
            critical_threshold=item.critical_threshold,
            depot_name=item.depot.name if item.depot else "Unknown",
            product_name=item.product.name if item.product else "Unknown"
        ))
    return res

@router.post("/depots/{depot_id}/inventory/{product_id}", response_model=schemas.InventoryResponse)
def update_depot_inventory(depot_id: int, product_id: int, update: schemas.InventoryUpdate, db: Session = Depends(get_db)):
    item = db.query(models.Inventory).filter(
        models.Inventory.depot_id == depot_id,
        models.Inventory.product_id == product_id
    ).first()
    
    if not item:
        # Create new if doesn't exist
        item = models.Inventory(
            depot_id=depot_id,
            product_id=product_id,
            current_stock=update.current_stock or 0,
            reorder_level=update.reorder_level or 50,
            critical_threshold=update.critical_threshold or 20
        )
        db.add(item)
    else:
        # Update existing
        if update.current_stock is not None:
            item.current_stock = update.current_stock
        if update.reorder_level is not None:
            item.reorder_level = update.reorder_level
        if update.critical_threshold is not None:
            item.critical_threshold = update.critical_threshold
            
    db.commit()
    db.refresh(item)
    return schemas.InventoryResponse(
        id=item.id,
        depot_id=item.depot_id,
        product_id=item.product_id,
        current_stock=item.current_stock,
        reorder_level=item.reorder_level,
        critical_threshold=item.critical_threshold,
        depot_name=item.depot.name if item.depot else "Unknown",
        product_name=item.product.name if item.product else "Unknown"
    )

# ─────────────────────────────────────────────────────────────
# DISTANCE MATRIX
# ─────────────────────────────────────────────────────────────

@router.get("/distances", response_model=List[schemas.DepotDistanceResponse])
def get_distances(db: Session = Depends(get_db)):
    entries = db.query(models.DepotDistance).all()
    res = []
    for e in entries:
        res.append(schemas.DepotDistanceResponse(
            id=e.id,
            source_depot_id=e.source_depot_id,
            destination_depot_id=e.destination_depot_id,
            distance_km=e.distance_km,
            estimated_transport_cost=e.estimated_transport_cost,
            estimated_transit_time=e.estimated_transit_time,
            source_depot_name=e.source_depot.name if e.source_depot else "Unknown",
            destination_depot_name=e.destination_depot.name if e.destination_depot else "Unknown"
        ))
    return res

@router.post("/distances", response_model=schemas.DepotDistanceResponse, status_code=status.HTTP_201_CREATED)
def create_distance_entry(
    entry: schemas.DepotDistanceCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles(models.UserRole.SUPER_ADMIN))
):
    # Check if entry already exists (upsert)
    existing = db.query(models.DepotDistance).filter(
        models.DepotDistance.source_depot_id == entry.source_depot_id,
        models.DepotDistance.destination_depot_id == entry.destination_depot_id
    ).first()
    
    if existing:
        existing.distance_km = entry.distance_km
        existing.estimated_transport_cost = entry.estimated_transport_cost
        existing.estimated_transit_time = entry.estimated_transit_time
        db.commit()
        db.refresh(existing)
        new_entry = existing
    else:
        new_entry = models.DepotDistance(**entry.dict())
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        
    return schemas.DepotDistanceResponse(
        id=new_entry.id,
        source_depot_id=new_entry.source_depot_id,
        destination_depot_id=new_entry.destination_depot_id,
        distance_km=new_entry.distance_km,
        estimated_transport_cost=new_entry.estimated_transport_cost,
        estimated_transit_time=new_entry.estimated_transit_time,
        source_depot_name=new_entry.source_depot.name if new_entry.source_depot else "Unknown",
        destination_depot_name=new_entry.destination_depot.name if new_entry.destination_depot else "Unknown"
    )

# ─────────────────────────────────────────────────────────────
# REBALANCING ENGINE TRIGGERS
# ─────────────────────────────────────────────────────────────

@router.get("/surplus-deficit")
def get_surplus_deficit(db: Session = Depends(get_db)):
    """Retrieve the current active surpluses and deficits without recalculating recommendations."""
    from app.services.rebalancing_service import get_current_surpluses_and_deficits
    return get_current_surpluses_and_deficits(db)

@router.post("/calculate")
def calculate_rebalancing(db: Session = Depends(get_db)):
    """Run forecasting first, then generate rebalancing recommendations."""
    # 1. Run statistical forecasting (updates weekly/monthly forecasts)
    run_demand_forecasting(db)
    
    # 2. Run matching algorithm (clears pending recs and builds new recommendations)
    results = run_rebalancing_calculations(db)
    
    # Real-time WebSocket dashboard broadcast
    import asyncio
    from app.services.websocket_manager import manager
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast_dashboard_update())
    except RuntimeError:
        pass
        
    return results

@router.get("/summary")
def get_rebalancing_summary(db: Session = Depends(get_db)):
    """Retrieve aggregate summary stats without recalculating."""
    # Count totals
    total_recs = db.query(models.TransferRecommendation).filter(models.TransferRecommendation.status == "PENDING").count()
    total_prod = db.query(models.ProductionRecommendation).filter(models.ProductionRecommendation.status == "PENDING").count()
    
    transfers = db.query(models.TransferRecommendation).filter(models.TransferRecommendation.status == "PENDING").all()
    avoided_prod = db.query(models.ProductionRecommendation).filter(models.ProductionRecommendation.status == "PENDING").all()
    
    total_units_saved = sum(t.quantity for t in transfers)
    total_cost_saved = sum(p.production_cost for p in avoided_prod)
    total_logistics_cost = sum(t.transport_cost for t in transfers)
    
    # Calculate surplus vs deficit count
    total_inventory = db.query(func.sum(models.Inventory.current_stock)).scalar() or 0
    
    # Calculate surplus inventory count and deficit count
    surplus_qty = 0
    deficit_qty = 0
    inventories = db.query(models.Inventory).all()
    for inv in inventories:
        # Default safety threshold
        required = inv.reorder_level
        if inv.current_stock > required:
            surplus_qty += (inv.current_stock - required)
        elif inv.current_stock < required:
            deficit_qty += (required - inv.current_stock)

    # Calculate depot distribution
    depot_stock = db.query(
        models.Depot.name,
        func.sum(models.Inventory.current_stock)
    ).join(models.Inventory).group_by(models.Depot.name).all()
    depot_distribution = [{"name": name, "value": int(stock or 0)} for name, stock in depot_stock]
    depot_distribution.sort(key=lambda x: x["value"], reverse=True)
    depot_distribution = depot_distribution[:4]

    net_savings = max(0.0, round((total_units_saved * 120.0) - total_logistics_cost, 2))
    savings_over_time = [
        {"name": "Week 1", "savings": round(net_savings * 0.15, 2), "transfers": int(total_recs * 0.2)},
        {"name": "Week 2", "savings": round(net_savings * 0.40, 2), "transfers": int(total_recs * 0.45)},
        {"name": "Week 3", "savings": round(net_savings * 0.75, 2), "transfers": int(total_recs * 0.70)},
        {"name": "Week 4", "savings": round(net_savings, 2), "transfers": total_recs}
    ]

    return {
        "total_inventory": int(total_inventory),
        "surplus_units": surplus_qty,
        "deficit_units": deficit_qty,
        "pending_transfers_count": total_recs,
        "pending_production_count": total_prod,
        "units_saved": total_units_saved,
        "production_cost_avoided": round(total_units_saved * 120.0, 2), # Mock average product price of ₹150 * 0.8
        "logistics_cost": round(total_logistics_cost, 2),
        "net_savings": net_savings,
        "depot_stock_distribution": depot_distribution,
        "savings_over_time": savings_over_time
    }

# ─────────────────────────────────────────────────────────────
# TRANSFER RECOMMENDATIONS
# ─────────────────────────────────────────────────────────────

@router.get("/transfers", response_model=List[schemas.TransferRecommendationResponse])
def get_transfers(db: Session = Depends(get_db)):
    recs = db.query(models.TransferRecommendation).all()
    res = []
    for r in recs:
        res.append(schemas.TransferRecommendationResponse(
            id=r.id,
            source_depot_id=r.source_depot_id,
            destination_depot_id=r.destination_depot_id,
            product_id=r.product_id,
            quantity=r.quantity,
            distance_km=r.distance_km,
            transport_cost=r.transport_cost,
            recommendation_score=r.recommendation_score,
            status=r.status,
            created_at=r.created_at,
            source_depot_name=r.source_depot.name if r.source_depot else "Unknown",
            destination_depot_name=r.destination_depot.name if r.destination_depot else "Unknown",
            product_name=r.product.name if r.product else "Unknown"
        ))
    return res

@router.post("/transfers/{transfer_id}/approve")
def approve_transfer(transfer_id: int, db: Session = Depends(get_db)):
    rec = db.query(models.TransferRecommendation).filter(models.TransferRecommendation.id == transfer_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    if rec.status != "PENDING":
        raise HTTPException(status_code=400, detail="Recommendation already processed")
        
    # Deduct stock from source inventory
    src_inv = db.query(models.Inventory).filter(
        models.Inventory.depot_id == rec.source_depot_id,
        models.Inventory.product_id == rec.product_id
    ).first()
    
    # Add stock to destination inventory
    dest_inv = db.query(models.Inventory).filter(
        models.Inventory.depot_id == rec.destination_depot_id,
        models.Inventory.product_id == rec.product_id
    ).first()
    
    if not src_inv or src_inv.current_stock < rec.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock at source depot for transfer approval")
        
    src_inv.current_stock -= rec.quantity
    
    if not dest_inv:
        dest_inv = models.Inventory(
            depot_id=rec.destination_depot_id,
            product_id=rec.product_id,
            current_stock=rec.quantity,
            reorder_level=50,
            critical_threshold=20
        )
        db.add(dest_inv)
    else:
        dest_inv.current_stock += rec.quantity
        
    rec.status = "APPROVED"
    
    # Log stock movements
    m1 = models.StockMovement(
        product_id=rec.product_id,
        source_depot_id=rec.source_depot_id,
        destination_depot_id=rec.destination_depot_id,
        quantity=rec.quantity,
        movement_type="TRANSFER",
        status="COMPLETED"
    )
    db.add(m1)
    
    # Log alert/audit logs
    db.add(models.AuditLog(
        action="TRANSFER_APPROVAL",
        module="REBALANCING",
        details=f"Approved transfer of {rec.quantity} units of product ID {rec.product_id} from Depot {rec.source_depot_id} to {rec.destination_depot_id}."
    ))
    
    db.commit()
    
    # Real-time WebSocket dashboard broadcast
    import asyncio
    from app.services.websocket_manager import manager
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast_dashboard_update())
    except RuntimeError:
        pass
        
    return {"detail": "Transfer approved and inventory adjusted successfully"}

@router.post("/transfers/{transfer_id}/reject")
def reject_transfer(transfer_id: int, db: Session = Depends(get_db)):
    rec = db.query(models.TransferRecommendation).filter(models.TransferRecommendation.id == transfer_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if rec.status != "PENDING":
        raise HTTPException(status_code=400, detail="Recommendation already processed")
    rec.status = "REJECTED"
    db.commit()
    
    # Real-time WebSocket dashboard broadcast
    import asyncio
    from app.services.websocket_manager import manager
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast_dashboard_update())
    except RuntimeError:
        pass
        
    return {"detail": "Transfer rejected"}

# ─────────────────────────────────────────────────────────────
# PRODUCTION RECOMMENDATIONS
# ─────────────────────────────────────────────────────────────

@router.get("/production", response_model=List[schemas.ProductionRecommendationResponse])
def get_production(db: Session = Depends(get_db)):
    recs = db.query(models.ProductionRecommendation).all()
    res = []
    for r in recs:
        res.append(schemas.ProductionRecommendationResponse(
            id=r.id,
            depot_id=r.depot_id,
            product_id=r.product_id,
            quantity=r.quantity,
            reason=r.reason,
            production_cost=r.production_cost,
            status=r.status,
            created_at=r.created_at,
            depot_name=r.depot.name if r.depot else "Unknown",
            product_name=r.product.name if r.product else "Unknown",
            state_name=r.depot.state.name if r.depot and r.depot.state else "Unknown"
        ))
    return res

@router.post("/production/{prod_rec_id}/approve")
def approve_production(prod_rec_id: int, db: Session = Depends(get_db)):
    rec = db.query(models.ProductionRecommendation).filter(models.ProductionRecommendation.id == prod_rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if rec.status != "PENDING":
        raise HTTPException(status_code=400, detail="Recommendation already processed")
        
    # Increment inventory in the depot
    inv = db.query(models.Inventory).filter(
        models.Inventory.depot_id == rec.depot_id,
        models.Inventory.product_id == rec.product_id
    ).first()
    
    if not inv:
        inv = models.Inventory(
            depot_id=rec.depot_id,
            product_id=rec.product_id,
            current_stock=rec.quantity,
            reorder_level=50,
            critical_threshold=20
        )
        db.add(inv)
    else:
        inv.current_stock += rec.quantity
        
    rec.status = "APPROVED"
    
    # Log movement
    db.add(models.StockMovement(
        product_id=rec.product_id,
        source_depot_id=None,
        destination_depot_id=rec.depot_id,
        quantity=rec.quantity,
        movement_type="PRODUCTION_RECEIPT",
        status="COMPLETED"
    ))
    
    db.commit()
    
    # Real-time WebSocket dashboard broadcast
    import asyncio
    from app.services.websocket_manager import manager
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast_dashboard_update())
    except RuntimeError:
        pass
        
    return {"detail": "Production request approved and received"}

@router.post("/production/{prod_rec_id}/reject")
def reject_production(prod_rec_id: int, db: Session = Depends(get_db)):
    rec = db.query(models.ProductionRecommendation).filter(models.ProductionRecommendation.id == prod_rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if rec.status != "PENDING":
        raise HTTPException(status_code=400, detail="Recommendation already processed")
    rec.status = "REJECTED"
    db.commit()
    
    # Real-time WebSocket dashboard broadcast
    import asyncio
    from app.services.websocket_manager import manager
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast_dashboard_update())
    except RuntimeError:
        pass
        
    return {"detail": "Production request rejected"}
