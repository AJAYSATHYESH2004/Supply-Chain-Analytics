from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.models import models

# Create database tables
# In a real production app, use Alembic migrations
try:
    Base.metadata.create_all(bind=engine)
    
    # Custom column migrations for MySQL / SQLite fallback
    from sqlalchemy import text
    with engine.connect() as connection:
        # Notifications alterations
        for col, type_ in [("is_archived", "INTEGER DEFAULT 0"), ("priority", "VARCHAR(50) DEFAULT 'MEDIUM'"), ("department", "VARCHAR(50) DEFAULT 'Inventory'")]:
            try:
                connection.execute(text(f"ALTER TABLE notifications ADD COLUMN {col} {type_}"))
                connection.commit()
            except Exception:
                pass
        
        # Alerts alterations
        try:
            connection.execute(text("ALTER TABLE alerts ADD COLUMN is_archived INTEGER DEFAULT 0"))
            connection.commit()
        except Exception:
            pass
            
        # SignupRequest alterations
        for col, type_ in [("requested_by_id", "INTEGER NULL"), ("department_id", "INTEGER NULL")]:
            try:
                connection.execute(text(f"ALTER TABLE signup_requests ADD COLUMN {col} {type_}"))
                connection.commit()
            except Exception:
                pass
except Exception as e:
    print(f"Error creating tables or running migrations: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
# In production, set ALLOWED_ORIGINS env var to your Vercel frontend URL
import os
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",")]
else:
    allowed_origins = ["*"]  # Allow all in dev

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Supply Chain AI API"}

@app.on_event("startup")
async def startup_event():
    from app.services.websocket_manager import manager
    await manager.initialize_redis()

from app.api.endpoints import products, suppliers, inventory, sales, forecasting, alerts, auth, settings as settings_api, dashboard_admin, dashboard_hod, dashboard_manager, dashboard_employee, departments, tasks, approvals, audit_logs, reports, notifications, rebalancing, websockets

app.include_router(websockets.router, prefix="/ws", tags=["websockets"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(departments.router, prefix=f"{settings.API_V1_STR}/departments", tags=["departments"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["tasks"])
app.include_router(approvals.router, prefix=f"{settings.API_V1_STR}/approvals", tags=["approvals"])
app.include_router(audit_logs.router, prefix=f"{settings.API_V1_STR}/audit-logs", tags=["audit-logs"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"])
app.include_router(products.router, prefix=f"{settings.API_V1_STR}/products", tags=["products"])
app.include_router(suppliers.router, prefix=f"{settings.API_V1_STR}/suppliers", tags=["suppliers"])
app.include_router(inventory.router, prefix=f"{settings.API_V1_STR}/inventory", tags=["inventory"])
app.include_router(sales.router, prefix=f"{settings.API_V1_STR}/sales", tags=["sales"])
app.include_router(forecasting.router, prefix=f"{settings.API_V1_STR}/forecasting", tags=["forecasting"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["alerts"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["notifications"])
app.include_router(settings_api.router, prefix=f"{settings.API_V1_STR}/settings", tags=["settings"])
app.include_router(rebalancing.router, prefix=f"{settings.API_V1_STR}/rebalancing", tags=["rebalancing"])
app.include_router(dashboard_admin.router, prefix=f"{settings.API_V1_STR}/dashboard/admin", tags=["dashboard_admin"])
app.include_router(dashboard_hod.router, prefix=f"{settings.API_V1_STR}/dashboard/hod", tags=["dashboard_hod"])
app.include_router(dashboard_manager.router, prefix=f"{settings.API_V1_STR}/dashboard/manager", tags=["dashboard_manager"])
app.include_router(dashboard_employee.router, prefix=f"{settings.API_V1_STR}/dashboard/employee", tags=["dashboard_employee"])
