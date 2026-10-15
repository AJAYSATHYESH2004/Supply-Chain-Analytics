"""
SmartChain AI - CavinKare Full Data Seed Script
================================================
Populates ALL tables with realistic CavinKare data:
  Suppliers, Products, InventoryTransactions, Sales,
  Forecasts, PurchaseOrders, Tasks, Approvals, AuditLogs
Run AFTER setup_org.py (users & departments must exist)
"""

import sys, os, random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models import models

db = SessionLocal()

def rnd_date(days_back=180):
    return datetime.now() - timedelta(days=random.randint(0, days_back))

# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────
def get_dept(name):
    return db.query(models.Department).filter(models.Department.name == name).first()

def get_user_by_role(role):
    return db.query(models.User).filter(models.User.role == role).first()

def get_users_by_role(role):
    return db.query(models.User).filter(models.User.role == role).all()

# ─────────────────────────────────────────────────────────────
# 1. SUPPLIERS
# ─────────────────────────────────────────────────────────────
suppliers_data = [
    {
        "name": "CavinKare Personal Care Division",
        "contact_person": "Rajan Krishnamurthy",
        "phone": "044-28151111",
        "email": "personalcare@cavinkare.com",
        "address": "CavinKare Pvt Ltd, Chennai, Tamil Nadu",
        "rating": 4.7,
        "on_time_deliveries": 145,
        "late_deliveries": 8,
        "avg_delivery_time": 2.5,
    },
    {
        "name": "CavinKare Dairy & Beverages Division",
        "contact_person": "Suresh Natarajan",
        "phone": "044-28151222",
        "email": "dairy@cavinkare.com",
        "address": "Cavin's Dairy Plant, Hosur Road, Tamil Nadu",
        "rating": 4.5,
        "on_time_deliveries": 210,
        "late_deliveries": 14,
        "avg_delivery_time": 1.2,
    },
    {
        "name": "CavinKare Foods & Snacks Division",
        "contact_person": "Anantha Padmanabhan",
        "phone": "044-28151333",
        "email": "foods@cavinkare.com",
        "address": "Garden Snacks Unit, Coimbatore, Tamil Nadu",
        "rating": 4.3,
        "on_time_deliveries": 98,
        "late_deliveries": 11,
        "avg_delivery_time": 3.0,
    },
    {
        "name": "CavinKare Professional & Salon Care",
        "contact_person": "Meenakshi Sundaram",
        "phone": "044-28151444",
        "email": "professional@cavinkare.com",
        "address": "Raaga Pro Unit, Ambattur, Chennai",
        "rating": 4.6,
        "on_time_deliveries": 67,
        "late_deliveries": 4,
        "avg_delivery_time": 3.5,
    },
    {
        "name": "CavinKare Home Care & Hygiene Division",
        "contact_person": "Priya Venkatesan",
        "phone": "044-28151555",
        "email": "homecare@cavinkare.com",
        "address": "Bacto-V Manufacturing, Perungudi, Chennai",
        "rating": 4.4,
        "on_time_deliveries": 55,
        "late_deliveries": 6,
        "avg_delivery_time": 2.8,
    },
]

# ─────────────────────────────────────────────────────────────
# 2. PRODUCTS — mapped to department + supplier
# ─────────────────────────────────────────────────────────────
# (name, category, price, stock, reorder, critical, supplier_idx, dept_name)
products_data = [
    # ── Hair Care ──
    ("CHIK Hairfall Prevent Egg White Protein Shampoo",  "Hair Care", 99,  320, 50, 20, 0, "Inventory"),
    ("CHIK Thick & Glossy Black Shampoo",                "Hair Care", 89,  280, 50, 20, 0, "Inventory"),
    ("CHIK Anti-Dandruff Fenugreek Shampoo",             "Hair Care", 95,  310, 50, 20, 0, "Inventory"),
    ("Meera Hair Wash Powder",                           "Hair Care", 45,  500, 80, 30, 0, "Inventory"),
    ("Meera Strong & Healthy Kunkudukai & Badam Shampoo","Hair Care", 110, 270, 50, 20, 0, "Inventory"),
    ("Meera Anti-Dandruff Small Onion & Fenugreek Shampoo","Hair Care",105, 260, 50, 20, 0,"Inventory"),
    ("Meera Pure Coconut Oil",                           "Hair Care", 75,  400, 60, 25, 0, "Inventory"),
    ("Meera Herbal Hair Oil",                            "Hair Care", 85,  350, 60, 25, 0, "Inventory"),
    ("Nyle Naturals Volume Enhance Reetha & Blackberry Shampoo","Hair Care",120,240,40,15,0,"Inventory"),
    ("Nyle Naturals Damage Repair Shikakai & Hibiscus Shampoo","Hair Care",125,230,40,15,0,"Inventory"),
    ("Nyle Naturals Dryness Hydration Shampoo",          "Hair Care", 115, 250, 40, 15, 0, "Inventory"),
    ("Indica Easy Shampoo Hair Color",                   "Hair Color", 55,  450, 70, 30, 0, "Inventory"),
    ("Indica Cream Hair Colour",                         "Hair Color", 65,  380, 60, 25, 0, "Inventory"),
    ("Indica Herbal Hair Colour",                        "Hair Color", 70,  360, 60, 25, 0, "Inventory"),
    ("Karthika Shikakai Powder",                         "Hair Care", 40,  520, 80, 30, 0, "Inventory"),
    ("Karthika Dryness Shield Shampoo",                  "Hair Care", 90,  300, 50, 20, 0, "Inventory"),
    ("Karthika Damage Shield Shampoo",                   "Hair Care", 92,  290, 50, 20, 0, "Inventory"),
    # ── Skin Care ──
    ("Spinz Black Magic Deodorant",                      "Skin Care", 150, 200, 40, 15, 0, "Inventory"),
    ("Spinz Enchante Deodorant",                         "Skin Care", 150, 190, 40, 15, 0, "Inventory"),
    ("Spinz Exotic Deodorant",                           "Skin Care", 150, 185, 40, 15, 0, "Inventory"),
    ("Spinz Blue Bounce Deodorant",                      "Skin Care", 150, 195, 40, 15, 0, "Inventory"),
    ("Spinz Mystic White Deodorant",                     "Skin Care", 150, 175, 40, 15, 0, "Inventory"),
    ("Spinz BB Cream",                                   "Skin Care", 199, 130, 30, 10, 0, "Inventory"),
    ("Spinz BB Face Talc (Radiant Pink)",                "Skin Care", 120, 220, 40, 15, 0, "Inventory"),
    ("Spinz BB Face Talc (Natural Beige)",               "Skin Care", 120, 210, 40, 15, 0, "Inventory"),
    ("Spinz BB Face Talc (Pearl White)",                 "Skin Care", 120, 230, 40, 15, 0, "Inventory"),
    ("Spinz DeTan Face Pack",                            "Skin Care", 175, 160, 30, 10, 0, "Inventory"),
    ("Fairever Beauty Lift Saffron, Milk & Rosehip Oil Face Cream","Skin Care",185,140,30,10,0,"Inventory"),
    ("Fairever Fruit Fairness Crème",                    "Skin Care", 165, 170, 30, 10, 0, "Inventory"),
    ("Buds & Berries Rice Water & Chia Seeds Hair Serum","Skin Care", 299, 80,  20,  8, 0, "Inventory"),
    ("Buds & Berries Tangerine Orange Body Wash",        "Skin Care", 249, 95,  20,  8, 0, "Inventory"),
    ("Buds & Berries Shea Butter Body Lotion",           "Skin Care", 275, 90,  20,  8, 0, "Inventory"),
    # ── Dairy & Beverages ──
    ("Cavin's Chocolate Milkshake",                      "Beverages", 30,  600, 100, 40, 1, "Sales"),
    ("Cavin's Belgian Chocolate Milkshake",              "Beverages", 45,  480, 80,  30, 1, "Sales"),
    ("Cavin's Kaju Butterscotch Milkshake",              "Beverages", 40,  500, 80,  30, 1, "Sales"),
    ("Cavin's Strawberry Milkshake",                     "Beverages", 30,  550, 90,  35, 1, "Sales"),
    ("Cavin's Vanilla Milkshake",                        "Beverages", 30,  520, 90,  35, 1, "Sales"),
    ("Cavin's Banana Milkshake",                         "Beverages", 30,  510, 90,  35, 1, "Sales"),
    ("Cavin's Mango Milkshake",                          "Beverages", 30,  580, 100, 40, 1, "Sales"),
    ("Cavin's Cold Coffee Chilled Latte",                "Beverages", 35,  460, 80,  30, 1, "Sales"),
    ("Cavin's Badam Mithai Milkshake",                   "Beverages", 50,  390, 70,  25, 1, "Sales"),
    ("Cavin's Rabdi Mithai Milkshake",                   "Beverages", 50,  370, 70,  25, 1, "Sales"),
    ("Cavin's Gulkand Mithai Milkshake",                 "Beverages", 50,  360, 70,  25, 1, "Sales"),
    ("Cavin's Rajbhog Mithai Milkshake",                 "Beverages", 50,  350, 70,  25, 1, "Sales"),
    ("Cavin's Mango Lassi",                              "Beverages", 35,  430, 75,  28, 1, "Sales"),
    ("Cavin's Rose Lassi",                               "Beverages", 35,  410, 75,  28, 1, "Sales"),
    ("Cavin's Fortified Buttermilk",                     "Dairy",     20,  700, 120, 50, 1, "Sales"),
    ("Cavin's Toned Milk / Full Cream Milk",             "Dairy",     25,  800, 150, 60, 1, "Sales"),
    ("Cavin's Curd (Pouch & Cups)",                      "Dairy",     30,  650, 120, 50, 1, "Sales"),
    ("Cavin's Soft Paneer",                              "Dairy",     85,  280, 50,  20, 1, "Sales"),
    ("Cavin's Table Butter",                             "Dairy",     55,  320, 60,  25, 1, "Sales"),
    ("Cavin's Cooking Butter",                           "Dairy",     50,  300, 60,  25, 1, "Sales"),
    ("Cavin's Pure Ghee / Cow Ghee",                     "Dairy",     650, 120, 20,   8, 1, "Sales"),
    ("Cavin's Cheese Slices",                            "Dairy",     130, 200, 40,  15, 1, "Sales"),
    ("Cavin's Cheese Block",                             "Dairy",     180, 170, 35,  12, 1, "Sales"),
    ("Cavin's Cheese Spread",                            "Dairy",     145, 190, 35,  12, 1, "Sales"),
    ("Maa Mango Fruit Drink",                            "Beverages", 20,  750, 120, 50, 1, "Sales"),
    ("Maa Apple Fruit Drink",                            "Beverages", 20,  700, 120, 50, 1, "Sales"),
    ("Maa Orange Fruit Drink",                           "Beverages", 20,  720, 120, 50, 1, "Sales"),
    ("Maa Lemon Fruit Drink",                            "Beverages", 20,  680, 120, 50, 1, "Sales"),
    # ── Snacks, Foods & Home Care ──
    ("Garden Yellow Banana Chips",                       "Snacks",    30,  400, 75,  30, 2, "Procurement"),
    ("Garden Mini Bhakarwadi",                           "Snacks",    25,  350, 70,  28, 2, "Procurement"),
    ("Garden Namkeens (Aloo Bhujia)",                    "Snacks",    20,  420, 80,  32, 2, "Procurement"),
    ("Garden Namkeens (Sev)",                            "Snacks",    20,  380, 70,  28, 2, "Procurement"),
    ("Garden Namkeens (Mixes)",                          "Snacks",    25,  360, 70,  28, 2, "Procurement"),
    ("Ruchi Magic Mango Pickle",                         "Foods",     60,  200, 40,  15, 2, "Procurement"),
    ("Ruchi Magic Garlic Pickle",                        "Foods",     65,  190, 40,  15, 2, "Procurement"),
    ("Ruchi Magic Lime Pickle",                          "Foods",     60,  195, 40,  15, 2, "Procurement"),
    ("Ruchi Magic Gongura Pickle",                       "Foods",     70,  180, 35,  12, 2, "Procurement"),
    ("Chinni's Pickles",                                 "Foods",     75,  160, 30,  10, 2, "Procurement"),
    ("Ruchi Gulab Jamun Mix",                            "Foods",     55,  230, 45,  18, 2, "Procurement"),
    ("Chinni's Vermicelli",                              "Foods",     40,  270, 50,  20, 2, "Procurement"),
    ("Bacto-V Multi-Surface Disinfectant Spray",         "Home Care", 120, 150, 30,  10, 4, "Procurement"),
    ("Bacto-V Gadget Disinfectant",                      "Home Care", 99,  170, 30,  10, 4, "Procurement"),
    # ── Salon & Professional Care ──
    ("Raaga Professional De-Tan Pack",                   "Professional Care", 250, 90, 20, 7, 3, "Inventory"),
    ("Raaga Professional Liposoluble Wax",               "Professional Care", 380, 70, 15, 5, 3, "Inventory"),
    ("Raaga Professional Hair Color",                    "Professional Care", 320, 80, 18, 6, 3, "Inventory"),
    ("Raaga Professional Hair Spa Kit",                  "Professional Care", 450, 60, 12, 4, 3, "Inventory"),
    ("Bikers Beard Growth Oil",                          "Men's Care", 299, 100, 20, 8, 3, "Inventory"),
    ("Bikers Beard Cream",                               "Men's Care", 199, 120, 25, 9, 3, "Inventory"),
    ("Bikers De-Tan Face Wash",                          "Men's Care", 175, 130, 25, 9, 3, "Inventory"),
    ("Bikers 2-in-1 Shampoo + Conditioner",              "Men's Care", 149, 150, 30, 10, 3, "Inventory"),
]

# ─────────────────────────────────────────────────────────────
def seed_all():
    print("Seeding Suppliers...")
    supplier_objs = []
    for s in suppliers_data:
        sup = models.Supplier(**s)
        db.add(sup)
        supplier_objs.append(sup)
    db.flush()

    print("Seeding Products...")
    dept_cache = {}
    product_objs = []
    for p in products_data:
        name, cat, price, stock, reorder, critical, sup_idx, dept_name = p
        if dept_name not in dept_cache:
            dept_cache[dept_name] = get_dept(dept_name)
        dept = dept_cache[dept_name]
        prod = models.Product(
            name=name,
            category=cat,
            price=price,
            current_stock=stock,
            reorder_level=reorder,
            critical_threshold=critical,
            supplier_id=supplier_objs[sup_idx].id,
            department_id=dept.id if dept else None,
        )
        db.add(prod)
        product_objs.append(prod)
    db.flush()

    print("Seeding Inventory Transactions...")
    for prod in product_objs:
        # Initial stock IN
        db.add(models.InventoryTransaction(
            product_id=prod.id,
            transaction_type="IN",
            quantity=prod.current_stock + random.randint(50, 200),
            reason="Initial stock receipt from supplier",
        ))
        # Some OUTs (sales/dispatch)
        for _ in range(random.randint(2, 5)):
            qty = random.randint(5, 40)
            db.add(models.InventoryTransaction(
                product_id=prod.id,
                transaction_type="OUT",
                quantity=qty,
                reason=random.choice([
                    "Customer order dispatch",
                    "Sales order fulfillment",
                    "Retail distribution",
                    "Wholesale batch dispatch",
                ]),
            ))
        # Occasional ADJUSTMENT
        if random.random() < 0.4:
            db.add(models.InventoryTransaction(
                product_id=prod.id,
                transaction_type="ADJUSTMENT",
                quantity=random.randint(-10, 10),
                reason="Quarterly stock audit adjustment",
            ))
    db.flush()

    print("Seeding Sales...")
    for prod in product_objs:
        for _ in range(random.randint(3, 8)):
            qty = random.randint(2, 30)
            db.add(models.Sale(
                product_id=prod.id,
                quantity=qty,
                unit_price=prod.price,
                total_amount=round(qty * prod.price, 2),
            ))
    db.flush()

    print("Seeding Forecasts...")
    for prod in product_objs:
        for period in ["WEEKLY", "MONTHLY", "QUARTERLY"]:
            db.add(models.Forecast(
                product_id=prod.id,
                period=period,
                predicted_demand=round(random.uniform(50, 500), 1),
                confidence_score=round(random.uniform(0.72, 0.97), 2),
            ))
    db.flush()

    print("Seeding Purchase Orders...")
    for sup in supplier_objs:
        for _ in range(random.randint(2, 4)):
            db.add(models.PurchaseOrder(
                supplier_id=sup.id,
                total_amount=round(random.uniform(15000, 250000), 2),
                status=random.choice([
                    models.PurchaseOrderStatus.PENDING,
                    models.PurchaseOrderStatus.APPROVED,
                    models.PurchaseOrderStatus.DELIVERED,
                ]),
            ))
    db.flush()

    print("Seeding Tasks...")
    managers = get_users_by_role(models.UserRole.MANAGER)
    employees = get_users_by_role(models.UserRole.EMPLOYEE)
    all_assignees = managers + employees

    tasks_templates = [
        ("Conduct weekly stock audit",    "HIGH",   "PENDING"),
        ("Update inventory records",      "MEDIUM", "IN_PROGRESS"),
        ("Process supplier invoice",      "HIGH",   "PENDING"),
        ("Verify delivery batch",         "MEDIUM", "COMPLETED"),
        ("Prepare monthly sales report",  "HIGH",   "IN_PROGRESS"),
        ("Review low-stock alerts",       "CRITICAL","PENDING"),
        ("Coordinate dispatch schedule",  "MEDIUM", "PENDING"),
        ("Update purchase order status",  "LOW",    "COMPLETED"),
        ("Quality check incoming stock",  "HIGH",   "PENDING"),
        ("Submit expense report",         "LOW",    "IN_PROGRESS"),
        ("Reconcile payment records",     "MEDIUM", "PENDING"),
        ("Review AI reorder suggestions", "HIGH",   "PENDING"),
        ("Train new staff on ERP system", "MEDIUM", "IN_PROGRESS"),
        ("Perform logistics audit",       "HIGH",   "COMPLETED"),
        ("Generate quarterly forecast",   "HIGH",   "PENDING"),
    ]
    for assignee in all_assignees:
        for title, priority, status in random.sample(tasks_templates, 3):
            db.add(models.Task(
                title=title,
                description=f"Assigned to {assignee.username} for their department operations.",
                assigned_to=assignee.id,
                status=models.TaskStatus[status],
                priority=priority,
                due_date=datetime.now() + timedelta(days=random.randint(1, 30)),
            ))
    db.flush()

    print("Seeding Approvals...")
    hod = get_user_by_role(models.UserRole.HOD)
    for mgr in managers:
        for _ in range(3):
            status = random.choice(["PENDING", "APPROVED", "REJECTED"])
            db.add(models.Approval(
                request_type=random.choice([
                    "PURCHASE_ORDER", "INVENTORY_REQUEST",
                    "BUDGET_REQUEST", "LEAVE_REQUEST", "STOCK_ADJUSTMENT"
                ]),
                request_id=random.randint(1, 50),
                requested_by=mgr.id,
                approved_by=hod.id if status != "PENDING" else None,
                status=models.ApprovalStatus[status],
                comments=random.choice([
                    "Approved as per budget plan.",
                    "Pending HOD review.",
                    "Rejected — exceeds quarterly budget.",
                    None,
                    "Request under review.",
                ]),
            ))
    db.flush()

    print("Seeding Audit Logs...")
    super_admin = get_user_by_role(models.UserRole.SUPER_ADMIN)
    all_users = db.query(models.User).all()
    actions  = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "APPROVE"]
    modules  = ["PRODUCTS", "USERS", "INVENTORY", "ORDERS", "APPROVALS", "REPORTS", "SETTINGS"]
    details_map = {
        "LOGIN":  "User logged in successfully.",
        "LOGOUT": "User session ended.",
        "CREATE": "New record created.",
        "UPDATE": "Record updated.",
        "DELETE": "Record deleted.",
        "APPROVE": "Request approved by HOD.",
    }
    ips = ["192.168.1.10", "192.168.1.22", "10.0.0.5", "172.16.0.3"]
    for user in all_users:
        for _ in range(random.randint(4, 8)):
            action = random.choice(actions)
            db.add(models.AuditLog(
                user_id=user.id,
                action=action,
                module=random.choice(modules),
                details=details_map.get(action, "Operation performed."),
                ip_address=random.choice(ips),
                timestamp=rnd_date(90),
            ))
    db.flush()

    print("Seeding User Settings...")
    for user in all_users:
        existing_setting = db.query(models.UserSettings).filter(models.UserSettings.user_id == user.id).first()
        if not existing_setting:
            db.add(models.UserSettings(
                user_id=user.id,
                primary_setting_1=random.choice([0, 1]),
                auto_text_alignment=random.choice([0, 1]),
                secondary_setting_1=random.choice([0, 1]),
                auto_delete_items=random.choice([0, 1]),
            ))
    db.flush()

    print("Seeding Signup Requests...")
    signup_templates = [
        ("Rajesh Kumar", "rajesh.kumar@gmail.com", "+91-9876543210", models.UserRole.EMPLOYEE, models.SignupRequestStatus.PENDING),
        ("Kavitha Selvam", "kavitha.s@outlook.com", "+91-9988776655", models.UserRole.MANAGER, models.SignupRequestStatus.APPROVED),
        ("Vikram Singh", "vikram.singh@yahoo.com", "+91-8877665544", models.UserRole.EMPLOYEE, models.SignupRequestStatus.REJECTED),
        ("Amit Sharma", "amit.sharma@hotmail.com", "+91-7766554433", models.UserRole.EMPLOYEE, models.SignupRequestStatus.PENDING),
    ]
    for name, email, phone, role, status in signup_templates:
        db.add(models.SignupRequest(
            full_name=name,
            email=email,
            phone=phone,
            requested_role=role,
            status=status,
            created_at=rnd_date(30),
        ))
    db.flush()

    print("Seeding Login Activities...")
    accounts = db.query(models.UserAccount).all()
    devices = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) Mobile/15E148",
    ]
    for acc in accounts:
        for _ in range(random.randint(3, 6)):
            login_t = rnd_date(60)
            logout_t = login_t + timedelta(minutes=random.randint(15, 240)) if random.random() < 0.85 else None
            db.add(models.LoginActivity(
                account_id=acc.account_id,
                login_time=login_t,
                logout_time=logout_t,
                ip_address=random.choice(ips),
                device_info=random.choice(devices),
            ))
    db.flush()

    print("Seeding Refresh Tokens...")
    for user in all_users:
        db.add(models.RefreshToken(
            user_id=user.id,
            token=f"rt_mock_{random.randint(10000000, 99999999)}",
            expires_at=datetime.now() + timedelta(days=random.randint(1, 7)),
            created_at=datetime.now() - timedelta(hours=random.randint(1, 24)),
        ))
        db.add(models.RefreshToken(
            user_id=user.id,
            token=f"rt_mock_{random.randint(10000000, 99999999)}",
            expires_at=datetime.now() - timedelta(days=random.randint(1, 10)),
            created_at=datetime.now() - timedelta(days=random.randint(11, 20)),
        ))
    db.flush()

    db.commit()
    print("\nAll CavinKare data seeded successfully!")
    print(f"   Suppliers        : {len(supplier_objs)}")
    print(f"   Products         : {len(product_objs)}")
    print(f"   Inventory Txns   : seeded")
    print(f"   Sales Records    : seeded")
    print(f"   Forecasts        : seeded ({len(product_objs)*3} rows)")
    print(f"   Purchase Orders  : seeded")
    print(f"   Tasks            : seeded")
    print(f"   Approvals        : seeded")
    print(f"   Audit Logs       : seeded")
    print(f"   User Settings    : seeded")
    print(f"   Signup Requests  : seeded")
    print(f"   Login Activities : seeded")
    print(f"   Refresh Tokens   : seeded")

if __name__ == "__main__":
    print("=" * 60)
    print("  SmartChain AI - CavinKare Data Seed")
    print("=" * 60)
    try:
        seed_all()
    except Exception as e:
        db.rollback()
        print(f"\nSeeding failed: {e}")
        raise
    finally:
        db.close()
