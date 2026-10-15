import sys
import os
from datetime import datetime, timedelta

# Setup PYTHONPATH dynamically
sys.path.insert(0, r"e:\INTERN SHIP\Supply chain analysis\backend")

from app.db.session import SessionLocal
from app.models import models
from app.services.rebalancing_service import run_rebalancing_calculations

def update_data():
    db = SessionLocal()
    try:
        print("Starting Database Update...")
        
        # 1. Clean up Demand History for all products
        print("Clearing old demand history...")
        db.query(models.DemandHistory).delete()
        db.commit()

        # 2. Populate Demand History for Product 1 at main depots
        # Chennai Depot (ID 1), Bangalore Depot (ID 5), Kochi Depot (ID 7), Vijayawada Depot (ID 9)
        # Sum of history equals the exact current demand
        targets = {
            1: 510974,  # Chennai (Tamil Nadu)
            5: 246012,  # Bangalore (Karnataka)
            7: 246428,  # Kochi (Kerala)
            9: 244351   # Vijayawada (Andhra Pradesh)
        }
        
        base_date = datetime.now() - timedelta(days=30)
        for depot_id, total_qty in targets.items():
            print(f"Adding demand history for Depot ID {depot_id} (total: {total_qty})...")
            daily_base = total_qty // 30
            remainder = total_qty - (daily_base * 29)
            
            for day in range(30):
                qty = daily_base if day < 29 else remainder
                sale_date = base_date + timedelta(days=day)
                db.add(models.DemandHistory(
                    product_id=1,
                    depot_id=depot_id,
                    sale_date=sale_date,
                    quantity=qty
                ))
        db.commit()

        # 3. Clean up and set Inventory for all products across all depots
        print("Updating inventories...")
        # First, set all inventories for all other products (and depots) to 0
        db.query(models.Inventory).update({
            models.Inventory.current_stock: 0,
            models.Inventory.reorder_level: 0,
            models.Inventory.critical_threshold: 0
        })
        db.commit()

        # Set specific inventory records for Product 1
        inventory_targets = {
            1: (450000, 380000, 100000),  # Chennai Depot: stock=450k, reorder=380k
            5: (320000, 280000, 70000),   # Bangalore Depot: stock=320k, reorder=280k
            7: (250000, 173550, 40000),   # Kochi Depot: stock=250k, reorder=173.55k
            9: (144040, 331040, 30000)    # Vijayawada Depot: stock=144.04k, reorder=331.04k
        }

        for depot_id, (stock, reorder, critical) in inventory_targets.items():
            # Check if record exists
            inv = db.query(models.Inventory).filter(
                models.Inventory.product_id == 1,
                models.Inventory.depot_id == depot_id
            ).first()
            if inv:
                inv.current_stock = stock
                inv.reorder_level = reorder
                inv.critical_threshold = critical
            else:
                db.add(models.Inventory(
                    product_id=1,
                    depot_id=depot_id,
                    current_stock=stock,
                    reorder_level=reorder,
                    critical_threshold=critical
                ))
        db.commit()

        # 4. Clean up and set Demand Forecasts for MONTHLY period
        print("Clearing and setting demand forecasts...")
        db.query(models.DemandForecast).filter(models.DemandForecast.period == "MONTHLY").delete()
        db.commit()

        forecast_date = datetime.now() + timedelta(days=30)
        forecast_targets = {
            1: 380000,  # Chennai
            5: 280000,  # Bangalore
            7: 173550,  # Kochi
            9: 331040   # Vijayawada
        }

        for depot_id, forecast_qty in forecast_targets.items():
            db.add(models.DemandForecast(
                product_id=1,
                depot_id=depot_id,
                forecast_date=forecast_date,
                predicted_demand=forecast_qty,
                confidence_score=0.9,
                period="MONTHLY"
            ))
        db.commit()

        # 5. Run Rebalancing calculations to regenerate Transfer Recommendations
        print("Running rebalancing calculations to regenerate transfer recommendations...")
        run_rebalancing_calculations(db)
        
        # Verify recommendation count
        tr_count = db.query(models.TransferRecommendation).count()
        print(f"Verified Transfer Recommendations count: {tr_count}")
        
        print("Database update successfully completed!")
    except Exception as e:
        db.rollback()
        print(f"Error updating database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    update_data()
