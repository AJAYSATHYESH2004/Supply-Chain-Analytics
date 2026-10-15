import sys
import os
import random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal, engine
from app.models import models

def haversine_distance(lat1, lon1, lat2, lon2):
    import math
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def seed_rebalancing_data():
    db = SessionLocal()
    try:
        # Create all tables (to ensure new ones are created)
        print("Ensuring database tables are initialized...")
        models.Base.metadata.create_all(bind=engine)
        
        # Check if states already exist
        if db.query(models.State).count() > 0:
            print("Database already seeded with rebalancing data.")
            return

        # ─────────────────────────────────────────────────────────────
        # 1. SEED STATES
        # ─────────────────────────────────────────────────────────────
        print("Seeding States...")
        states_data = [
            {"name": "Tamil Nadu", "region": "South"},
            {"name": "Karnataka", "region": "South"},
            {"name": "Kerala", "region": "South"},
            {"name": "Andhra Pradesh", "region": "South"}
        ]
        state_objs = {}
        for s in states_data:
            state = models.State(**s)
            db.add(state)
            db.flush()
            state_objs[state.name] = state

        # ─────────────────────────────────────────────────────────────
        # 2. SEED DEPOTS
        # ─────────────────────────────────────────────────────────────
        print("Seeding Depots...")
        depots_data = [
            # Tamil Nadu
            {"name": "Chennai Depot", "state_id": state_objs["Tamil Nadu"].id, "address": "12, GST Road, Guindy, Chennai", "capacity": 10000, "latitude": 13.0827, "longitude": 80.2707},
            {"name": "Coimbatore Depot", "state_id": state_objs["Tamil Nadu"].id, "address": "45, Avinashi Road, Coimbatore", "capacity": 8000, "latitude": 11.0168, "longitude": 76.9558},
            {"name": "Salem Depot", "state_id": state_objs["Tamil Nadu"].id, "address": "8, Junction Road, Salem", "capacity": 5000, "latitude": 11.6643, "longitude": 78.1460},
            {"name": "Madurai Depot", "state_id": state_objs["Tamil Nadu"].id, "address": "19, Bypass Road, Madurai", "capacity": 6000, "latitude": 9.9252, "longitude": 78.1198},
            # Karnataka
            {"name": "Bangalore Depot", "state_id": state_objs["Karnataka"].id, "address": "102, Outer Ring Road, Whitefield, Bangalore", "capacity": 12000, "latitude": 12.9716, "longitude": 77.5946},
            {"name": "Mysore Depot", "state_id": state_objs["Karnataka"].id, "address": "5, Hebbal Industrial Area, Mysore", "capacity": 4000, "latitude": 12.2958, "longitude": 76.6394},
            # Kerala
            {"name": "Kochi Depot", "state_id": state_objs["Kerala"].id, "address": "88, NH 47, Kalamassery, Kochi", "capacity": 7000, "latitude": 9.9312, "longitude": 76.2673},
            {"name": "Trivandrum Depot", "state_id": state_objs["Kerala"].id, "address": "14, bypass Road, Trivandrum", "capacity": 5000, "latitude": 8.5241, "longitude": 76.9366},
            # Andhra Pradesh
            {"name": "Vijayawada Depot", "state_id": state_objs["Andhra Pradesh"].id, "address": "12, Benz Circle, Vijayawada", "capacity": 6000, "latitude": 16.5062, "longitude": 80.6480},
            {"name": "Visakhapatnam Depot", "state_id": state_objs["Andhra Pradesh"].id, "address": "77, Gajuwaka, Visakhapatnam", "capacity": 8000, "latitude": 17.6868, "longitude": 83.2185}
        ]
        depot_objs = []
        for d in depots_data:
            depot = models.Depot(**d)
            db.add(depot)
            db.flush()
            depot_objs.append(depot)

        # ─────────────────────────────────────────────────────────────
        # 3. SEED DISTANCE MATRIX & TRANSPORT COSTS
        # ─────────────────────────────────────────────────────────────
        print("Seeding Distance Matrix & Transport Costs...")
        for i in range(len(depot_objs)):
            for j in range(len(depot_objs)):
                if i == j:
                    continue
                d1 = depot_objs[i]
                d2 = depot_objs[j]
                
                # Compute distance using GPS coordinates
                distance = haversine_distance(d1.latitude, d1.longitude, d2.latitude, d2.longitude)
                
                # Preset some specific distances from example requirements:
                # Chennai -> Salem = 340 KM
                # Chennai -> Coimbatore = 510 KM
                # Madurai -> Coimbatore = 210 KM
                if d1.name == "Chennai Depot" and d2.name == "Salem Depot":
                    distance = 340.0
                elif d1.name == "Chennai Depot" and d2.name == "Coimbatore Depot":
                    distance = 510.0
                elif d1.name == "Madurai Depot" and d2.name == "Coimbatore Depot":
                    distance = 210.0
                
                # Est transport cost: ₹12 per KM, Fixed cost: ₹500
                cost = (distance * 12.0) + 500.0
                transit_time = distance / 50.0 # 50 km/h avg speed
                
                # Depot distance matrix
                db.add(models.DepotDistance(
                    source_depot_id=d1.id,
                    destination_depot_id=d2.id,
                    distance_km=round(distance, 1),
                    estimated_transport_cost=round(cost, 2),
                    estimated_transit_time=round(transit_time, 1)
                ))
                
                # Transport costs config
                db.add(models.TransportCost(
                    source_depot_id=d1.id,
                    destination_depot_id=d2.id,
                    cost_per_km=12.0,
                    fixed_charge=500.0
                ))
        db.flush()

        # ─────────────────────────────────────────────────────────────
        # 4. SEED DEPOT INVENTORIES
        # ─────────────────────────────────────────────────────────────
        print("Seeding Depot Inventories...")
        products = db.query(models.Product).all()
        if len(products) == 0:
            print("WARNING: No products found in the database. Please run seed_cavinkare.py first!")
            return
            
        for p in products:
            for d in depot_objs:
                # Base stock variables
                stock = random.randint(150, 450)
                reorder = 200
                critical = 80
                
                # Explicit Surplus and Deficit Setup for "CHIK Hairfall Prevent Egg White Protein Shampoo" (first product)
                # To test Rebalancing AI matching: Chennai -> Coimbatore
                if p.name == "CHIK Hairfall Prevent Egg White Protein Shampoo":
                    if d.name == "Chennai Depot":
                        stock = 1200
                        reorder = 500
                        critical = 200
                    elif d.name == "Coimbatore Depot":
                        stock = 100
                        reorder = 600
                        critical = 200
                    elif d.name == "Salem Depot":
                        stock = 450
                        reorder = 250
                        critical = 100
                    elif d.name == "Madurai Depot":
                        stock = 300
                        reorder = 250
                        critical = 100
                
                db.add(models.Inventory(
                    depot_id=d.id,
                    product_id=p.id,
                    current_stock=stock,
                    reorder_level=reorder,
                    critical_threshold=critical
                ))
        db.flush()

        # ─────────────────────────────────────────────────────────────
        # 5. SEED DEMAND HISTORY
        # ─────────────────────────────────────────────────────────────
        print("Seeding Demand History...")
        base_date = datetime.now()
        for p in products:
            for d in depot_objs:
                # Add 30 days of historical daily demand per product/depot
                for day in range(30):
                    sale_date = base_date - timedelta(days=day)
                    qty = random.randint(5, 45)
                    # Add a seasonality bump to beverages in Chennai
                    if p.category == "Beverages" and d.name == "Chennai Depot":
                        qty += random.randint(10, 25)
                        
                    db.add(models.DemandHistory(
                        product_id=p.id,
                        depot_id=d.id,
                        sale_date=sale_date,
                        quantity=qty
                    ))
        db.commit()
        print("Rebalancing database seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_rebalancing_data()
