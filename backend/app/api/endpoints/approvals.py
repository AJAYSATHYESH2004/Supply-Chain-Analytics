from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models import models
from app.schemas import approval as schemas
from app.core import security

router = APIRouter()

@router.get("/", response_model=List[schemas.ApprovalResponse])
def get_approvals(
    status: Optional[models.ApprovalStatus] = None,
    requested_by: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Approval)
    if status:
        query = query.filter(models.Approval.status == status)
    if requested_by:
        query = query.filter(models.Approval.requested_by == requested_by)
    return query.all()

@router.post("/", response_model=schemas.ApprovalResponse, status_code=status.HTTP_201_CREATED)
def create_approval_request(request: schemas.ApprovalCreate, db: Session = Depends(get_db)):
    # AI Validation Rule for Procurement requests
    if request.request_type in ["PURCHASE_REQUEST", "PURCHASE_ORDER"]:
        # Find the product
        product = db.query(models.Product).filter(models.Product.id == request.request_id).first()
        if product:
            # Check nearby depots for available surplus inventory
            surplus_inventories = db.query(models.Inventory).filter(
                models.Inventory.product_id == product.id,
                models.Inventory.current_stock > models.Inventory.reorder_level
            ).all()
            
            if surplus_inventories:
                # Check for deficit depots for the same product
                deficit_inventories = db.query(models.Inventory).filter(
                    models.Inventory.product_id == product.id,
                    models.Inventory.current_stock < models.Inventory.reorder_level
                ).all()
                
                # Check transfer feasibility (route distance mapping exists)
                for surplus_inv in surplus_inventories:
                    for deficit_inv in deficit_inventories:
                        route = db.query(models.DepotDistance).filter(
                            models.DepotDistance.source_depot_id == surplus_inv.depot_id,
                            models.DepotDistance.destination_depot_id == deficit_inv.depot_id
                        ).first()
                        
                        if route:
                            # Recommend transfer by creating a PENDING recommendation
                            transfer_qty = min(
                                surplus_inv.current_stock - surplus_inv.reorder_level,
                                deficit_inv.reorder_level - deficit_inv.current_stock
                            )
                            if transfer_qty > 0:
                                existing_rec = db.query(models.TransferRecommendation).filter(
                                    models.TransferRecommendation.source_depot_id == surplus_inv.depot_id,
                                    models.TransferRecommendation.destination_depot_id == deficit_inv.depot_id,
                                    models.TransferRecommendation.product_id == product.id,
                                    models.TransferRecommendation.status == "PENDING"
                                ).first()
                                if not existing_rec:
                                    rec = models.TransferRecommendation(
                                        source_depot_id=surplus_inv.depot_id,
                                        destination_depot_id=deficit_inv.depot_id,
                                        product_id=product.id,
                                        quantity=transfer_qty,
                                        distance_km=route.distance_km,
                                        transport_cost=round(route.estimated_transport_cost * (transfer_qty / 10.0), 2),
                                        recommendation_score=90.0,
                                        status="PENDING"
                                    )
                                    db.add(rec)
                                    db.commit()
                                
                                raise HTTPException(
                                    status_code=400,
                                    detail=f"AI Validation: Surplus stock of {product.name} exists at Depot '{surplus_inv.depot.name}' ({surplus_inv.current_stock} units). A transfer of {transfer_qty} units to Depot '{deficit_inv.depot.name}' is recommended. Purchase request blocked."
                                )

    new_request = models.Approval(**request.dict())
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    # Audit log
    db.add(models.AuditLog(
        user_id=new_request.requested_by,
        action="CREATE",
        module="APPROVALS",
        details=f"Created approval request REQ-{new_request.id} ({new_request.request_type}) in PENDING status."
    ))
    db.commit()
    
    # Notify Super Admins and HODs of new approval request
    from app.services.notification_service import create_notification
    import asyncio
    from app.services.websocket_manager import manager
    try:
        admin_and_hods = db.query(models.User).join(models.UserAccount).filter(
            models.UserAccount.role.in_([models.UserRole.SUPER_ADMIN, models.UserRole.HOD])
        ).all()
        for u in admin_and_hods:
            create_notification(
                db,
                user_id=u.id,
                title="New Purchase Approval Required",
                message=f"New approval request PO-{new_request.id} ({new_request.request_type}) is pending your review.",
                type="PURCHASE_APPROVAL"
            )
            # Real-time WebSocket approval event
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(manager.broadcast_approval_update(u.id, new_request))
            except RuntimeError:
                pass
        
        # Real-time WebSocket dashboard update
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast_dashboard_update())
        except RuntimeError:
            pass
    except Exception as e:
        print(f"Error creating approval request notifications: {e}")
        
    return new_request

@router.put("/{approval_id}/approve", response_model=schemas.ApprovalResponse)
def approve_request(
    approval_id: int, 
    update: schemas.ApprovalUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    db_request = db.query(models.Approval).filter(models.Approval.id == approval_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    db_request.status = update.status or models.ApprovalStatus.APPROVED
    db_request.approved_by = current_user.id
    db_request.comments = update.comments
    
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="APPROVAL",
        module="APPROVALS",
        details=f"Set status of request REQ-{db_request.id} ({db_request.request_type}) to {db_request.status.lower()}."
    ))
    db.commit()
    db.refresh(db_request)
    
    # Notify requester of decision
    from app.services.notification_service import create_notification
    import asyncio
    from app.services.websocket_manager import manager
    try:
        create_notification(
            db,
            user_id=db_request.requested_by,
            title=f"Approval Request {db_request.status.capitalize()}",
            message=f"Your approval request PO-{db_request.id} ({db_request.request_type}) has been {db_request.status.lower()}.",
            type="PURCHASE_APPROVAL"
        )
        
        # Real-time WebSocket approval event to requester
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast_approval_update(db_request.requested_by, db_request))
            loop.create_task(manager.broadcast_dashboard_update())
        except RuntimeError:
            pass
    except Exception as e:
        print(f"Error creating approval update notification: {e}")
        
    return db_request
