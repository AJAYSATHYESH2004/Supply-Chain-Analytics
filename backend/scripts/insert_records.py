from app.db.session import SessionLocal, engine
from app.models.models import Base, Product, Supplier, Sale, User, UserRole, InventoryTransaction
from datetime import datetime, timedelta
import random

def insert_records():
    """Insert 10 records each into main tables"""
    print("Connecting to database...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # ==================== SUPPLIERS ====================
        print("\nInserting 10 Suppliers...")
        suppliers = [
            Supplier(name="TechCorp Ltd", contact_person="Alice Johnson", phone="+1-111-222-3333", email="alice@techcorp.com", rating=4.9, on_time_deliveries=98, late_deliveries=1, avg_delivery_time=2.5),
            Supplier(name="Global Supply Co", contact_person="Bob Wilson", phone="+1-222-333-4444", email="bob@globalsupply.com", rating=4.2, on_time_deliveries=85, late_deliveries=8, avg_delivery_time=5.0),
            Supplier(name="FastTrack Logistics", contact_person="Carol Davis", phone="+1-333-444-5555", email="carol@fasttrack.com", rating=4.7, on_time_deliveries=94, late_deliveries=3, avg_delivery_time=3.2),
            Supplier(name="Premium Parts Inc", contact_person="David Lee", phone="+1-444-555-6666", email="david@premiumparts.com", rating=3.8, on_time_deliveries=76, late_deliveries=12, avg_delivery_time=6.5),
            Supplier(name="Quick Distribute", contact_person="Emma Brown", phone="+1-555-666-7777", email="emma@quickdist.com", rating=4.5, on_time_deliveries=90, late_deliveries=5, avg_delivery_time=4.0),
            Supplier(name="Elite Imports", contact_person="Frank Martinez", phone="+1-666-777-8888", email="frank@elite.com", rating=4.6, on_time_deliveries=92, late_deliveries=4, avg_delivery_time=3.8),
            Supplier(name="Standard Solutions", contact_person="Grace Harris", phone="+1-777-888-9999", email="grace@standard.com", rating=3.9, on_time_deliveries=78, late_deliveries=11, avg_delivery_time=6.2),
            Supplier(name="Express Delivery Hub", contact_person="Henry Taylor", phone="+1-888-999-0000", email="henry@express.com", rating=4.4, on_time_deliveries=88, late_deliveries=6, avg_delivery_time=4.5),
            Supplier(name="Reliable Vendors", contact_person="Isla Moore", phone="+1-999-000-1111", email="isla@reliable.com", rating=4.3, on_time_deliveries=86, late_deliveries=7, avg_delivery_time=5.2),
            Supplier(name="Swift Commerce", contact_person="Jack Anderson", phone="+1-000-111-2222", email="jack@swift.com", rating=4.8, on_time_deliveries=96, late_deliveries=2, avg_delivery_time=2.9),
        ]
        db.add_all(suppliers)
        db.commit()
        for s in suppliers:
            db.refresh(s)
        print(f"✓ Successfully inserted 10 suppliers")
        
        # ==================== PRODUCTS ====================
        print("\nInserting 10 Products...")
        products = [
            Product(name="Intel Core i7 Processor", category="Processors", price=350.0, current_stock=25, reorder_level=10, critical_threshold=5, supplier_id=suppliers[0].id),
            Product(name="DDR4 16GB RAM", category="Memory", price=80.0, current_stock=50, reorder_level=15, critical_threshold=8, supplier_id=suppliers[1].id),
            Product(name="Samsung SSD 1TB", category="Storage", price=120.0, current_stock=30, reorder_level=12, critical_threshold=6, supplier_id=suppliers[2].id),
            Product(name="Graphics Card RTX 3060", category="Graphics", price=400.0, current_stock=10, reorder_level=5, critical_threshold=2, supplier_id=suppliers[0].id),
            Product(name="Motherboard ASUS ProB460", category="Motherboards", price=250.0, current_stock=20, reorder_level=8, critical_threshold=4, supplier_id=suppliers[3].id),
            Product(name="Power Supply 750W", category="Power", price=90.0, current_stock=35, reorder_level=10, critical_threshold=5, supplier_id=suppliers[4].id),
            Product(name="CPU Cooler Arctic Freezer", category="Cooling", price=45.0, current_stock=60, reorder_level=20, critical_threshold=10, supplier_id=suppliers[1].id),
            Product(name="Wireless Keyboard Logitech", category="Peripherals", price=65.0, current_stock=40, reorder_level=15, critical_threshold=7, supplier_id=suppliers[2].id),
            Product(name="Gaming Mouse Razer", category="Peripherals", price=75.0, current_stock=35, reorder_level=12, critical_threshold=6, supplier_id=suppliers[5].id),
            Product(name="HDMI Cable 2m", category="Cables", price=12.0, current_stock=200, reorder_level=50, critical_threshold=25, supplier_id=suppliers[3].id),
        ]
        db.add_all(products)
        db.commit()
        for p in products:
            db.refresh(p)
        print(f"✓ Successfully inserted 10 products")
        
        # ==================== USERS ====================
        print("\nInserting 10 Users...")
        users = [
            User(username="john_doe", email="john.doe@company.com", hashed_password="hashedpwd1", role=UserRole.HOD),
            User(username="jane_smith", email="jane.smith@company.com", hashed_password="hashedpwd2", role=UserRole.INVENTORY_MANAGER),
            User(username="mike_johnson", email="mike.johnson@company.com", hashed_password="hashedpwd3", role=UserRole.SALES_MANAGER),
            User(username="sarah_wilson", email="sarah.wilson@company.com", hashed_password="hashedpwd4", role=UserRole.INVENTORY_MANAGER),
            User(username="alex_brown", email="alex.brown@company.com", hashed_password="hashedpwd5", role=UserRole.SALES_MANAGER),
            User(username="emma_davis", email="emma.davis@company.com", hashed_password="hashedpwd6", role=UserRole.INVENTORY_MANAGER),
            User(username="tom_miller", email="tom.miller@company.com", hashed_password="hashedpwd7", role=UserRole.HOD),
            User(username="lucy_anderson", email="lucy.anderson@company.com", hashed_password="hashedpwd8", role=UserRole.SALES_MANAGER),
            User(username="chris_thomas", email="chris.thomas@company.com", hashed_password="hashedpwd9", role=UserRole.INVENTORY_MANAGER),
            User(username="nina_jackson", email="nina.jackson@company.com", hashed_password="hashedpwd10", role=UserRole.HOD),
        ]
        db.add_all(users)
        db.commit()
        print(f"✓ Successfully inserted 10 users")
        
        # ==================== SALES ====================
        print("\nInserting 10 Sales Records...")
        sales = []
        base_date = datetime.now()
        for i, product in enumerate(products):
            for j in range(1):  # Add 1 sale per product to get 10 total
                sale_date = base_date - timedelta(days=random.randint(1, 30))
                quantity = random.randint(1, 5)
                unit_price = product.price
                total_amount = quantity * unit_price
                sales.append(Sale(
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_amount=total_amount,
                    sale_date=sale_date
                ))
        db.add_all(sales)
        db.commit()
        print(f"✓ Successfully inserted 10 sales records")
        
        # ==================== INVENTORY TRANSACTIONS ====================
        print("\nInserting 10 Inventory Transactions...")
        transactions = []
        for i, product in enumerate(products):
            for j in range(1):  # Add 1 transaction per product
                transaction_type = random.choice(["IN", "OUT", "ADJUSTMENT"])
                quantity = random.randint(5, 20) if transaction_type == "IN" else random.randint(1, 10)
                reason = f"{transaction_type} transaction for {product.name}"
                timestamp = base_date - timedelta(days=random.randint(1, 30))
                transactions.append(InventoryTransaction(
                    product_id=product.id,
                    transaction_type=transaction_type,
                    quantity=quantity,
                    reason=reason,
                    timestamp=timestamp
                ))
        db.add_all(transactions)
        db.commit()
        print(f"✓ Successfully inserted 10 inventory transactions")
        
        print("\n" + "="*50)
        print("✓ All records inserted successfully!")
        print("="*50)
        print("\nSummary:")
        print(f"  • 10 Suppliers added")
        print(f"  • 10 Products added")
        print(f"  • 10 Users added")
        print(f"  • 10 Sales records added")
        print(f"  • 10 Inventory transactions added")
        
    except Exception as e:
        print(f"✗ Error inserting records: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    insert_records()
