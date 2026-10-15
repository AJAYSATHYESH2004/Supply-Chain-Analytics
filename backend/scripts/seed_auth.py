from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models import models
from app.core import security

def seed_users():
    db = SessionLocal()
    try:
        # Define seed data
        users_data = [
            {"username": "admin", "email": "admin@smartchain.ai", "password": "admin123", "role": models.UserRole.SUPER_ADMIN},
            {"username": "hod", "email": "hod@smartchain.ai", "password": "hod123", "role": models.UserRole.HOD},
            {"username": "manager", "email": "manager@smartchain.ai", "password": "manager123", "role": models.UserRole.MANAGER},
            {"username": "employee", "email": "employee@smartchain.ai", "password": "employee123", "role": models.UserRole.EMPLOYEE},
        ]

        for u_data in users_data:
            # Check if user exists by username or email
            user = db.query(models.User).filter(
                (models.User.username == u_data["username"]) | 
                (models.User.email == u_data["email"])
            ).first()
            
            if not user:
                # Create basic user profile
                user = models.User(
                    username=u_data["username"],
                    email=u_data["email"],
                    hashed_password=security.get_password_hash(u_data["password"]),
                    role=u_data["role"]
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"Created user: {u_data['username']}")
            
            # Check if account exists
            account = db.query(models.UserAccount).filter(models.UserAccount.user_id == user.id).first()
            if not account:
                # Create user account credentials
                account = models.UserAccount(
                    user_id=user.id,
                    username=user.username,
                    email=user.email,
                    password_hash=security.get_password_hash(u_data["password"]),
                    role=u_data["role"],
                    is_active=1
                )
                db.add(account)
                db.commit()
                print(f"Created account for: {u_data['username']} with role: {u_data['role']}")
            else:
                print(f"Account for {u_data['username']} already exists.")

    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting authentication seeding...")
    seed_users()
    print("Seeding complete.")
