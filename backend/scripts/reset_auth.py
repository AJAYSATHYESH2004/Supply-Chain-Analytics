from app.db.session import SessionLocal
from app.models import models
from app.core import security

def reset_and_seed():
    db = SessionLocal()
    try:
        print("Cleaning up existing auth data...")
        db.query(models.LoginActivity).delete()
        db.query(models.UserAccount).delete()
        # Only delete users that we are about to seed or are duplicates
        # Actually, let's just delete users with the specific emails/usernames we want
        seed_data = [
            ("admin", "admin@smartchain.ai", "admin123", models.UserRole.SUPER_ADMIN),
            ("hod", "hod@smartchain.ai", "hod123", models.UserRole.HOD),
            ("manager", "manager@smartchain.ai", "manager123", models.UserRole.MANAGER),
            ("employee", "employee@smartchain.ai", "employee123", models.UserRole.EMPLOYEE),
        ]
        
        for username, email, password, role in seed_data:
            # Delete any user with this username or email
            db.query(models.User).filter((models.User.username == username) | (models.User.email == email)).delete()
            db.commit()
            
            # Create fresh user
            user = models.User(
                username=username,
                email=email,
                hashed_password=security.get_password_hash(password),
                role=role
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Create account
            account = models.UserAccount(
                user_id=user.id,
                username=username,
                email=email,
                password_hash=security.get_password_hash(password),
                role=role,
                is_active=1
            )
            db.add(account)
            db.commit()
            print(f"Propagated fresh account for {username}")

        print("Reset and seed complete.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_seed()
