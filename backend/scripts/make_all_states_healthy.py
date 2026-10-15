"""
make_all_states_healthy.py
--------------------------
Boosts inventory for ALL states so that:
total_inventory >= forecasted_demand
for Tamil Nadu, Karnataka, Kerala, and Andhra Pradesh.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models import models

def make_all_healthy():
    db = SessionLocal()
    try:
        states = db.query(models.State).all()
        products = db.query(models.Product).all()
        n_products = len(products)
        print(f"Total products: {n_products}")

        for state in states:
            depots = db.query(models.Depot).filter(models.Depot.state_id == state.id).all()
            depot_ids = [d.id for d in depots]
            if not depot_ids:
                print(f"No depots for state: {state.name}")
                continue

            # 1. Get forecasted demand for this state (period = MONTHLY)
            forecasted_demand = float(db.query(models.func.sum(models.DemandForecast.predicted_demand)).filter(
                models.DemandForecast.depot_id.in_(depot_ids),
                models.DemandForecast.period == "MONTHLY"
            ).scalar() or 0.0)

            print(f"\nState: {state.name}")
            print(f"  Forecasted Demand: {forecasted_demand:,}")

            # 2. Get all inventory rows for depots in this state
            inventory_rows = db.query(models.Inventory).filter(
                models.Inventory.depot_id.in_(depot_ids)
            ).all()
            n_rows = len(inventory_rows)
            print(f"  Inventory Rows: {n_rows}")

            if n_rows == 0:
                print("  [Warning] No inventory rows found for this state.")
                continue

            # 3. Target inventory: forecasted_demand + 100,000 to be safe
            target_total = forecasted_demand + 100_000
            # Target per row
            target_per_row = int(target_total // n_rows) + 100
            # Ensure it's at least a minimum value
            target_per_row = max(target_per_row, 1000)

            print(f"  Setting each inventory row's current_stock to: {target_per_row:,}")
            for row in inventory_rows:
                row.current_stock = target_per_row
                # Also ensure reorder level and critical threshold are lower than current stock
                # so we don't trigger immediate critical alarms if we want healthy state
                if row.reorder_level >= row.current_stock:
                    row.reorder_level = int(row.current_stock * 0.7)
                if row.critical_threshold >= row.current_stock:
                    row.critical_threshold = int(row.current_stock * 0.3)

            # Let's commit for this state
            db.commit()
            
            # Recalculate actual updated total inventory
            actual_total = float(db.query(models.func.sum(models.Inventory.current_stock)).filter(
                models.Inventory.depot_id.in_(depot_ids)
            ).scalar() or 0.0)
            print(f"  Actual Updated Inventory: {actual_total:,}")
            print(f"  Status: {'HEALTHY (Low Risk)' if actual_total >= forecasted_demand else 'STILL DEFICIT (High Risk)'}")

        # Recalculate rebalancing to reflect the new state of inventory
        print("\nRecalculating rebalancing recommendations...")
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
    make_all_healthy()
