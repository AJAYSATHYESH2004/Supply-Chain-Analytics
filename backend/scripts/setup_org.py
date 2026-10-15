"""
SmartChain AI - Organizational Structure Setup Script
======================================================
Drops all tables (disabling FK checks), recreates schema,
then seeds the full hierarchy:
  - Super Admin
  - HOD (global, cross-department)
  - 5 Departments × (1 Manager + 1 Staff Employee)
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import SessionLocal, engine
from app.models import models
from app.core import security

# ---------------------------------------------------------------------------
# Step 1: Drop all tables safely (MySQL FK-aware)
# ---------------------------------------------------------------------------
def drop_all_tables():
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        # Fetch all table names in the DB
        result = conn.execute(text("SHOW TABLES;"))
        tables = [row[0] for row in result]
        for table in tables:
            conn.execute(text(f"DROP TABLE IF EXISTS `{table}`;"))
            print(f"  Dropped: {table}")
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        conn.commit()
    print("All tables dropped.\n")

# ---------------------------------------------------------------------------
# Step 2: Recreate all tables from the current models
# ---------------------------------------------------------------------------
def recreate_tables():
    models.Base.metadata.create_all(bind=engine)
    print("All tables created from models.\n")

# ---------------------------------------------------------------------------
# Step 3: Seed the organizational hierarchy
# ---------------------------------------------------------------------------
DEPARTMENTS = [
    {
        "name": "Inventory",
        "description": "Manage product stock and inventory operations.",
    },
    {
        "name": "Procurement",
        "description": "Manage purchasing and supplier coordination.",
    },
    {
        "name": "Sales",
        "description": "Manage customer sales and revenue tracking.",
    },
    {
        "name": "Logistics",
        "description": "Handle delivery and transportation activities.",
    },
    {
        "name": "Finance",
        "description": "Manage financial transactions and reporting.",
    },
]

def make_user(db, username, email, password, role, department_id=None):
    hashed = security.get_password_hash(password)
    user = models.User(
        username=username,
        email=email,
        hashed_password=hashed,
        role=role,
        department_id=department_id,
    )
    db.add(user)
    db.flush()  # get user.id without full commit

    account = models.UserAccount(
        user_id=user.id,
        username=username,
        email=email,
        password_hash=hashed,
        role=role,
        is_active=1,
    )
    db.add(account)
    return user

def seed_organization():
    db = SessionLocal()
    try:
        print("Seeding organizational structure...")

        # ── Super Admin ──────────────────────────────────────────────────────
        super_admin = make_user(
            db,
            username="admin",
            email="admin@smartchain.ai",
            password="admin123",
            role=models.UserRole.SUPER_ADMIN,
        )
        db.flush()
        print(f"  [SUPER ADMIN]  admin  |  admin@smartchain.ai  |  Password: admin123")

        # ── HOD (global) ──────────────────────────────────────────────────────
        hod = make_user(
            db,
            username="hod",
            email="hod@smartchain.ai",
            password="hod123",
            role=models.UserRole.HOD,
        )
        db.flush()
        print(f"  [HOD]          hod    |  hod@smartchain.ai    |  Password: hod123")

        print()

        # ── Departments ──────────────────────────────────────────────────────
        for dept_info in DEPARTMENTS:
            dept_key = dept_info["name"].lower()

            # Create the department (manager_id assigned after manager is created)
            dept = models.Department(
                name=dept_info["name"],
                description=dept_info["description"],
                hod_id=hod.id,
            )
            db.add(dept)
            db.flush()

            # Manager
            mgr = make_user(
                db,
                username=f"{dept_key}_manager",
                email=f"{dept_key}.manager@smartchain.ai",
                password="manager123",
                role=models.UserRole.MANAGER,
                department_id=dept.id,
            )
            db.flush()
            dept.manager_id = mgr.id

            # Staff (Employee)
            staff = make_user(
                db,
                username=f"{dept_key}_staff",
                email=f"{dept_key}.staff@smartchain.ai",
                password="staff123",
                role=models.UserRole.EMPLOYEE,
                department_id=dept.id,
            )
            db.flush()

            print(f"  [{dept_info['name'].upper()} DEPT]")
            print(f"    Manager : {dept_key}_manager  |  Password: manager123")
            print(f"    Staff   : {dept_key}_staff    |  Password: staff123")

        db.commit()
        print("\nOrganization setup complete!")
        print_summary()

    except Exception as e:
        db.rollback()
        print(f"\nSetup failed: {e}")
        raise
    finally:
        db.close()

def print_summary():
    print("""
+----------------------------------------------------------+
|            SmartChain AI - Credentials Summary           |
+----------------------------------------------------------+
|  Role            Username               Password         |
|----------------------------------------------------------|
|  Super Admin     admin                  admin123         |
|  HOD             hod                    hod123           |
|  Inv Manager     inventory_manager      manager123       |
|  Inv Staff       inventory_staff        staff123         |
|  Pro Manager     procurement_manager    manager123       |
|  Pro Staff       procurement_staff      staff123         |
|  Sales Manager   sales_manager          manager123       |
|  Sales Staff     sales_staff            staff123         |
|  Log Manager     logistics_manager      manager123       |
|  Log Staff       logistics_staff        staff123         |
|  Fin Manager     finance_manager        manager123       |
|  Fin Staff       finance_staff          staff123         |
+----------------------------------------------------------+
""")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("  SmartChain AI - Org Setup")
    print("=" * 60)
    print("\nStep 1: Dropping all existing tables...")
    drop_all_tables()
    print("Step 2: Recreating schema from models...")
    recreate_tables()
    print("Step 3: Seeding organizational hierarchy...")
    seed_organization()
