from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    HOD = "HOD"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"

class InventoryStatus(str, enum.Enum):
    NORMAL = "NORMAL"
    LOW_STOCK = "LOW_STOCK"
    CRITICAL_STOCK = "CRITICAL_STOCK"
    OVERSTOCKED = "OVERSTOCKED"

class AlertPriority(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class Alert(Base):
    __tablename__ = "alerts"
    alert_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(20), default="MEDIUM") # CRITICAL, HIGH, MEDIUM, LOW
    department = Column(String(50), nullable=True)
    assigned_role = Column(String(50), nullable=True)
    is_read = Column(Integer, default=0) # 0 = Unread, 1 = Read
    is_archived = Column(Integer, default=0) # 0 = Active, 1 = Archived
    created_at = Column(DateTime, server_default=func.now())
    
    # Backwards compatibility fields
    type = Column(String(50), nullable=True)
    product = Column(String(100), nullable=True)
    supplier = Column(String(100), nullable=True)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False) # TASK_ASSIGNED, PURCHASE_APPROVAL, SUPPLIER_DELAY, INVENTORY_UPDATE, FORECAST_ALERT
    is_read = Column(Integer, default=0) # 0 = Unread, 1 = Read
    is_archived = Column(Integer, default=0) # 0 = Active, 1 = Archived
    priority = Column(String(50), default="MEDIUM")
    department = Column(String(50), default="Inventory")
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.EMPLOYEE)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    account = relationship("UserAccount", back_populates="user", uselist=False)
    department = relationship("Department", back_populates="users", foreign_keys=[department_id])

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    contact_person = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(Text)
    rating = Column(Float, default=0.0)
    on_time_deliveries = Column(Integer, default=0)
    late_deliveries = Column(Integer, default=0)
    avg_delivery_time = Column(Float, default=0.0) # In days
    
    products = relationship("Product", back_populates="supplier")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    category = Column(String(50), index=True)
    price = Column(Float, nullable=False)
    current_stock = Column(Integer, default=0)
    reorder_level = Column(Integer, default=10)
    critical_threshold = Column(Integer, default=5)
    image_url = Column(String(255))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    supplier = relationship("Supplier", back_populates="products")
    sales = relationship("Sale", back_populates="product")
    inventory_history = relationship("InventoryTransaction", back_populates="product")

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    transaction_type = Column(String(20)) # IN, OUT, ADJUSTMENT
    quantity = Column(Integer, nullable=False)
    reason = Column(String(255))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="inventory_history")

class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    sale_date = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="sales")

class UserAccount(Base):
    __tablename__ = "user_accounts"
    account_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Integer, default=1)  # 1 = True, 0 = False
    failed_attempts = Column(Integer, default=0)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="account")

class SignupRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class SignupRequest(Base):
    __tablename__ = "signup_requests"
    request_id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(150))
    email = Column(String(150))
    phone = Column(String(20))
    requested_role = Column(Enum(UserRole))
    status = Column(Enum(SignupRequestStatus), default=SignupRequestStatus.PENDING)
    created_at = Column(DateTime, server_default=func.now())
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)

    requested_by = relationship("User", foreign_keys=[requested_by_id])
    department = relationship("Department", foreign_keys=[department_id])

class LoginActivity(Base):
    __tablename__ = "login_activity"
    login_id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(Integer, ForeignKey("user_accounts.account_id"), nullable=False)
    login_time = Column(DateTime, server_default=func.now())
    logout_time = Column(DateTime, nullable=True)
    ip_address = Column(String(50), nullable=True)
    device_info = Column(String(255), nullable=True)
    account = relationship("UserAccount")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    user = relationship("User")

class Forecast(Base):
    __tablename__ = "forecasts"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    period = Column(String(20)) # WEEKLY, MONTHLY, QUARTERLY
    predicted_demand = Column(Float)
    confidence_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserSettings(Base):
    __tablename__ = "user_settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    primary_setting_1 = Column(Integer, default=0) # 0 False, 1 True
    auto_text_alignment = Column(Integer, default=1)
    secondary_setting_1 = Column(Integer, default=0)
    auto_delete_items = Column(Integer, default=0)
    
    user = relationship("User")

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    hod_id = Column(Integer, ForeignKey("users.id"), nullable=True) # User ID of HOD
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True) # User ID of Manager
    created_at = Column(DateTime, server_default=func.now())

    hod = relationship("User", foreign_keys=[hod_id])
    manager = relationship("User", foreign_keys=[manager_id])
    users = relationship("User", back_populates="department", foreign_keys="[User.department_id]")

class TaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(150), nullable=False)
    description = Column(Text)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    assignee = relationship("User", foreign_keys=[assigned_to])

    @property
    def department_name(self):
        if self.assignee and self.assignee.department:
            return self.assignee.department.name
        return "Inventory"

class ApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Approval(Base):
    __tablename__ = "approvals"
    id = Column(Integer, primary_key=True, autoincrement=True)
    request_type = Column(String(50)) # PURCHASE_ORDER, INVENTORY_REQUEST, etc.
    request_id = Column(Integer) # ID of the related object
    requested_by = Column(Integer, ForeignKey("users.id"))
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING)
    comments = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class PurchaseOrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    total_amount = Column(Float)
    status = Column(Enum(PurchaseOrderStatus), default=PurchaseOrderStatus.PENDING)
    created_at = Column(DateTime, server_default=func.now())

    supplier = relationship("Supplier")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(50)) # CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    module = Column(String(50)) # PRODUCTS, USERS, etc.
    details = Column(Text)
    ip_address = Column(String(50))
    timestamp = Column(DateTime, server_default=func.now())

    user = relationship("User")

class State(Base):
    __tablename__ = "states"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    region = Column(String(50))

class Depot(Base):
    __tablename__ = "depots"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    state_id = Column(Integer, ForeignKey("states.id"))
    address = Column(Text)
    capacity = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)

    state = relationship("State")

class DepotDistance(Base):
    __tablename__ = "depot_distances"
    id = Column(Integer, primary_key=True, index=True)
    source_depot_id = Column(Integer, ForeignKey("depots.id"))
    destination_depot_id = Column(Integer, ForeignKey("depots.id"))
    distance_km = Column(Float, nullable=False)
    estimated_transport_cost = Column(Float, nullable=False)
    estimated_transit_time = Column(Float, nullable=False) # in hours

    source_depot = relationship("Depot", foreign_keys=[source_depot_id])
    destination_depot = relationship("Depot", foreign_keys=[destination_depot_id])

class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    depot_id = Column(Integer, ForeignKey("depots.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    current_stock = Column(Integer, default=0)
    reorder_level = Column(Integer, default=50)
    critical_threshold = Column(Integer, default=20)

    depot = relationship("Depot")
    product = relationship("Product")

class StockMovement(Base):
    __tablename__ = "stock_movements"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    source_depot_id = Column(Integer, ForeignKey("depots.id"), nullable=True)
    destination_depot_id = Column(Integer, ForeignKey("depots.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    movement_type = Column(String(50)) # e.g., 'TRANSFER', 'INCOMING', 'OUTGOING'
    status = Column(String(50), default="PENDING") # 'PENDING', 'IN_TRANSIT', 'COMPLETED', 'REJECTED'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product")
    source_depot = relationship("Depot", foreign_keys=[source_depot_id])
    destination_depot = relationship("Depot", foreign_keys=[destination_depot_id])

class DemandHistory(Base):
    __tablename__ = "demand_history"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    depot_id = Column(Integer, ForeignKey("depots.id"), nullable=False)
    sale_date = Column(DateTime(timezone=True), nullable=False)
    quantity = Column(Integer, nullable=False)

    product = relationship("Product")
    depot = relationship("Depot")

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    depot_id = Column(Integer, ForeignKey("depots.id"), nullable=False)
    forecast_date = Column(DateTime(timezone=True), nullable=False)
    predicted_demand = Column(Float, nullable=False)
    confidence_score = Column(Float, default=0.9)
    period = Column(String(50)) # 'WEEKLY', 'MONTHLY'

    product = relationship("Product")
    depot = relationship("Depot")

class TransferRecommendation(Base):
    __tablename__ = "transfer_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    source_depot_id = Column(Integer, ForeignKey("depots.id"), nullable=False)
    destination_depot_id = Column(Integer, ForeignKey("depots.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    distance_km = Column(Float, nullable=False)
    transport_cost = Column(Float, nullable=False)
    recommendation_score = Column(Float, default=1.0)
    status = Column(String(50), default="PENDING") # 'PENDING', 'APPROVED', 'REJECTED'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    source_depot = relationship("Depot", foreign_keys=[source_depot_id])
    destination_depot = relationship("Depot", foreign_keys=[destination_depot_id])
    product = relationship("Product")

class ProductionRecommendation(Base):
    __tablename__ = "production_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    depot_id = Column(Integer, ForeignKey("depots.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String(255))
    production_cost = Column(Float, nullable=False)
    status = Column(String(50), default="PENDING") # 'PENDING', 'APPROVED', 'REJECTED'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    depot = relationship("Depot")
    product = relationship("Product")

class TransportCost(Base):
    __tablename__ = "transport_costs"
    id = Column(Integer, primary_key=True, index=True)
    source_depot_id = Column(Integer, ForeignKey("depots.id"), nullable=False)
    destination_depot_id = Column(Integer, ForeignKey("depots.id"), nullable=False)
    cost_per_km = Column(Float, nullable=False)
    fixed_charge = Column(Float, default=0.0)

    source_depot = relationship("Depot", foreign_keys=[source_depot_id])
    destination_depot = relationship("Depot", foreign_keys=[destination_depot_id])
