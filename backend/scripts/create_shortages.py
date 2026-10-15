import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models import models
import random

def create_shortages():
    db = SessionLocal()
    try:
        # Get all products and depots
        products = db.query(models.Product).all()
        depots = db.query(models.Depot).all()
        
        if not products or not depots:
            print("No products or depots found.")
            return

        # 1. Choose 5 random products to make globally scarce (forces production recommendations)
        scarce_products = random.sample(products, min(5, len(products)))
        print(f"Creating global scarcity for {len(scarce_products)} products to force production recommendations:")
        for prod in scarce_products:
            # Set stock to 5 (well below reorder level of 50) at ALL depots
            db.query(models.Inventory).filter(models.Inventory.product_id == prod.id).update({
                "current_stock": 5,
                "reorder_level": 50,
                "critical_threshold": 10
            })
            print(f"  - Product: {prod.name} (ID {prod.id}) set to stock=5 across all depots")

        # 2. Choose 5 other random inventory rows to have local shortages (will be solved by transfers)
        all_inventories = db.query(models.Inventory).filter(~models.Inventory.product_id.in_([p.id for p in scarce_products])).all()
        local_shortage_rows = random.sample(all_inventories, min(5, len(all_inventories)))
        print(f"\nCreating local shortages for {len(local_shortage_rows)} other inventory rows (will trigger transfers):")
        for i, row in enumerate(local_shortage_rows):
            row.reorder_level = 50
            row.current_stock = 15
            row.critical_threshold = 10
            print(f"  - Depot {row.depot.name} (ID {row.depot_id}), Product {row.product.name} (ID {row.product_id}) set to stock=15, reorder=50")

        db.commit()
        print("\nSuccessfully updated database to create shortages.")
        
        # Trigger rebalancing recalculation so recommendations and summaries update
        print("Recalculating rebalancing recommendations...")
        from app.services.rebalancing_service import run_rebalancing_calculations
        run_rebalancing_calculations(db)
        print("Rebalancing calculations completed.")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_shortages()
