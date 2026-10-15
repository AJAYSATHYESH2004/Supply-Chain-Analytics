from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# State Schemas
class StateBase(BaseModel):
    name: str
    region: Optional[str] = None

class StateCreate(StateBase):
    pass

class StateResponse(StateBase):
    id: int
    class Config:
        from_attributes = True

# Depot Schemas
class DepotBase(BaseModel):
    name: str
    state_id: int
    address: Optional[str] = None
    capacity: int
    latitude: float
    longitude: float

class DepotCreate(DepotBase):
    pass

class DepotResponse(DepotBase):
    id: int
    state_name: Optional[str] = None
    class Config:
        from_attributes = True

# DepotDistance Schemas
class DepotDistanceBase(BaseModel):
    source_depot_id: int
    destination_depot_id: int
    distance_km: float
    estimated_transport_cost: float
    estimated_transit_time: float

class DepotDistanceCreate(DepotDistanceBase):
    pass

class DepotDistanceResponse(DepotDistanceBase):
    id: int
    source_depot_name: Optional[str] = None
    destination_depot_name: Optional[str] = None
    class Config:
        from_attributes = True

# Inventory Schemas
class InventoryBase(BaseModel):
    depot_id: int
    product_id: int
    current_stock: int
    reorder_level: int
    critical_threshold: int

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    current_stock: Optional[int] = None
    reorder_level: Optional[int] = None
    critical_threshold: Optional[int] = None

class InventoryResponse(InventoryBase):
    id: int
    depot_name: Optional[str] = None
    product_name: Optional[str] = None
    class Config:
        from_attributes = True

# StockMovement Schemas
class StockMovementBase(BaseModel):
    product_id: int
    source_depot_id: Optional[int] = None
    destination_depot_id: Optional[int] = None
    quantity: int
    movement_type: str
    status: str

class StockMovementCreate(StockMovementBase):
    pass

class StockMovementResponse(StockMovementBase):
    id: int
    created_at: datetime
    product_name: Optional[str] = None
    source_depot_name: Optional[str] = None
    destination_depot_name: Optional[str] = None
    class Config:
        from_attributes = True

# DemandHistory Schemas
class DemandHistoryBase(BaseModel):
    product_id: int
    depot_id: int
    sale_date: datetime
    quantity: int

class DemandHistoryCreate(DemandHistoryBase):
    pass

class DemandHistoryResponse(DemandHistoryBase):
    id: int
    product_name: Optional[str] = None
    depot_name: Optional[str] = None
    class Config:
        from_attributes = True

# DemandForecast Schemas
class DemandForecastBase(BaseModel):
    product_id: int
    depot_id: int
    forecast_date: datetime
    predicted_demand: float
    confidence_score: float
    period: str

class DemandForecastCreate(DemandForecastBase):
    pass

class DemandForecastResponse(DemandForecastBase):
    id: int
    product_name: Optional[str] = None
    depot_name: Optional[str] = None
    class Config:
        from_attributes = True

# TransferRecommendation Schemas
class TransferRecommendationBase(BaseModel):
    source_depot_id: int
    destination_depot_id: int
    product_id: int
    quantity: int
    distance_km: float
    transport_cost: float
    recommendation_score: float
    status: str

class TransferRecommendationCreate(TransferRecommendationBase):
    pass

class TransferRecommendationResponse(TransferRecommendationBase):
    id: int
    created_at: datetime
    source_depot_name: Optional[str] = None
    destination_depot_name: Optional[str] = None
    product_name: Optional[str] = None
    class Config:
        from_attributes = True

# ProductionRecommendation Schemas
class ProductionRecommendationBase(BaseModel):
    depot_id: int
    product_id: int
    quantity: int
    reason: Optional[str] = None
    production_cost: float
    status: str

class ProductionRecommendationCreate(ProductionRecommendationBase):
    pass

class ProductionRecommendationResponse(ProductionRecommendationBase):
    id: int
    created_at: datetime
    depot_name: Optional[str] = None
    product_name: Optional[str] = None
    state_name: Optional[str] = None
    class Config:
        from_attributes = True

# TransportCost Schemas
class TransportCostBase(BaseModel):
    source_depot_id: int
    destination_depot_id: int
    cost_per_km: float
    fixed_charge: float

class TransportCostCreate(TransportCostBase):
    pass

class TransportCostResponse(TransportCostBase):
    id: int
    source_depot_name: Optional[str] = None
    destination_depot_name: Optional[str] = None
    class Config:
        from_attributes = True
