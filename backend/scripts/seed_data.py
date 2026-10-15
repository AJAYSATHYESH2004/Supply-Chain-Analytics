from app.db.session import SessionLocal, engine
from app.models.models import Base, Product, Supplier, Sale, User, UserRole
from app.core.config import settings
from datetime import datetime, timedelta
import random

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(User).first():
        print("Database already seeded.")
        return

    print("Seeding Suppliers...")
    suppliers = [
        Supplier(name="Electronics Hub", contact_person="John Smith", phone="+1-234-567-8900", email="john@electrohub.com", rating=4.8, on_time_deliveries=95, late_deliveries=2, avg_delivery_time=3.0),
        Supplier(name="Global Logistics", contact_person="Sarah Chen", phone="+1-987-654-3210", email="sarah@global.com", rating=3.5, on_time_deliveries=70, late_deliveries=15, avg_delivery_time=7.5),
        Supplier(name="PowerCell Inc", contact_person="Mike Ross", phone="+1-555-012-3456", email="mike@powercell.com", rating=4.5, on_time_deliveries=88, late_deliveries=5, avg_delivery_time=4.0),
    ]
    db.add_all(suppliers)
    db.commit()
    
    # Refresh to get IDs
    for s in suppliers:
        db.refresh(s)

    print("Seeding Products...")
    products = [
        Product(name="Laptop Battery X1", category="Electronics", price=120.0, current_stock=15, reorder_level=10, critical_threshold=5, supplier_id=suppliers[2].id),
        Product(name="Wireless Mouse", category="Peripherals", price=25.0, current_stock=8, reorder_level=15, critical_threshold=5, supplier_id=suppliers[0].id),
        Product(name="USB-C Cable 2m", category="Accessories", price=15.0, current_stock=120, reorder_level=50, critical_threshold=20, supplier_id=suppliers[1].id),
        Product(name="Mechanical Keyboard", category="Peripherals", price=85.0, current_stock=3, reorder_level=10, critical_threshold=5, supplier_id=suppliers[0].id),
        Product(name="Monitor 27\" 4K", category="Electronics", price=350.0, current_stock=45, reorder_level=20, critical_threshold=10, supplier_id=suppliers[0].id),
    ]
    db.add_all(products)
    db.commit()

    print("Seeding Sales Data (Last 30 days)...")
    sales = []
    base_date = datetime.now()
    for p in products:
        for i in range(30):
            sale_date = base_date - timedelta(days=i)
            # Create some random sales patterns
            quantity = random.randint(1, 10) if p.name == "USB-C Cable 2m" else random.randint(0, 3)
            if quantity > 0:
                sales.append(Sale(
                    product_id=p.id,
                    quantity=quantity,
                    unit_price=p.price,
                    total_amount=quantity * p.price,
                    sale_date=sale_date
                ))
    db.add_all(sales)
    db.commit()

    print("Seeding Users...")
    admin = User(
        username="admin",
        email="admin@smartchain.ai",
        hashed_password="hashed_password_here", # In real app, hash this
        role=UserRole.HOD
    )
    db.add(admin)
    db.commit()

    print("Database seeding completed.")
    db.close()

if __name__ == "__main__":
    seed_db()
