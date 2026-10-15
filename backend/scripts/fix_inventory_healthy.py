"""
fix_inventory_healthy.py
------------------------
Boosts depot inventory so that Karnataka and Kerala have
total_inventory >= forecasted_demand  →  they become HEALTHY states.
Tamil Nadu and Andhra Pradesh remain in deficit (as seen in reality).

Current forecast per state (after retrain):
  Tamil Nadu:     fc ≈ 1,109,581  →  keep deficit (realistic)
  Karnataka:      fc ≈   555,705  →  boost to healthy (need ~560k+)
  Kerala:         fc ≈   555,931  →  boost to healthy (need ~560k+)
  Andhra Pradesh: fc ≈   554,729  →  keep deficit (realistic)

Karnataka depots:  Bangalore (id=5), Mysore (id=6) - 2 depots
Kerala depots:     Kochi (id=7), Trivandrum (id=8) - 2 depots

Strategy: set current_stock to a high value per product/depot so the SUM
across all products × depots exceeds the forecasted demand.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models import models
from sqlalchemy import text

def fix_inventory():
    db = SessionLocal()
    try:
        # -----------------------------------------------------------------
        # Identify depot IDs for Karnataka and Kerala
        # -----------------------------------------------------------------
        karnataka_depots = (
            db.query(models.Depot)
            .join(models.State)
            .filter(models.State.name == "Karnataka")
            .all()
        )
        kerala_depots = (
            db.query(models.Depot)
            .join(models.State)
            .filter(models.State.name == "Kerala")
            .all()
        )

        k_ids  = [d.id for d in karnataka_depots]
        kl_ids = [d.id for d in kerala_depots]

        print(f"Karnataka depot IDs : {k_ids}")
        print(f"Kerala depot IDs    : {kl_ids}")

        # -----------------------------------------------------------------
        # Get all products
        # -----------------------------------------------------------------
        products = db.query(models.Product).all()
        n_products = len(products)
        print(f"Total products      : {n_products}")

        # -----------------------------------------------------------------
        # Calculate required stock per depot so SUM > forecast
        # Karnataka  target total inventory : 700,000  (fc ≈ 556k)
        # Kerala     target total inventory : 700,000  (fc ≈ 556k)
        # Distribute evenly across products × depots
        # -----------------------------------------------------------------

        # Karnataka: target 700k across (n_products * 2 depots) rows
        karnataka_target = 700_000
        karnataka_per_row = max(300, karnataka_target // (n_products * len(k_ids)))

        # Kerala: target 700k across (n_products * 2 depots) rows  
        kerala_target = 700_000
        kerala_per_row = max(300, kerala_target // (n_products * len(kl_ids)))

        print(f"Karnataka stock per inventory row : {karnataka_per_row}")
        print(f"Kerala     stock per inventory row : {kerala_per_row}")

        # -----------------------------------------------------------------
        # Update Karnataka inventory rows
        # -----------------------------------------------------------------
        updated_karnataka = 0
        for depot_id in k_ids:
            rows = db.query(models.Inventory).filter(
                models.Inventory.depot_id == depot_id
            ).all()
            for row in rows:
                row.current_stock = karnataka_per_row
                updated_karnataka += 1

        # -----------------------------------------------------------------
        # Update Kerala inventory rows
        # -----------------------------------------------------------------
        updated_kerala = 0
        for depot_id in kl_ids:
            rows = db.query(models.Inventory).filter(
                models.Inventory.depot_id == depot_id
            ).all()
            for row in rows:
                row.current_stock = kerala_per_row
                updated_kerala += 1

        db.commit()

        print(f"\n[OK] Updated {updated_karnataka} Karnataka inventory rows  -> ~{karnataka_per_row * n_products * len(k_ids):,} total units")
        print(f"[OK] Updated {updated_kerala} Kerala inventory rows      -> ~{kerala_per_row * n_products * len(kl_ids):,} total units")
        print("\nKarnataka and Kerala should now be HEALTHY states.")
        print("Tamil Nadu and Andhra Pradesh remain DEFICIT states.")
        print("\nDone. Reload the Forecasting page to see the update.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_inventory()
