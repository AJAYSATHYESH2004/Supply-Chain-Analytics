from app.db.session import SessionLocal
from app.models.models import User, UserRole
from app.core.security import get_password_hash

def fix_users():
    db = SessionLocal()
    try:
        # Clear existing users to avoid conflicts
        from app.models.models import UserSettings
        db.query(UserSettings).delete()
        db.query(User).delete()
        
        users = [
            User(username="ajay_admin", email="admin@smartchain.ai", hashed_password=get_password_hash("admin123"), role="SUPER_ADMIN"),
            User(username="manager1", email="manager@smartchain.ai", hashed_password=get_password_hash("manager123"), role="MANAGER"),
            User(username="hod1", email="hod@smartchain.ai", hashed_password=get_password_hash("hod123"), role="HOD"),
            User(username="employee1", email="emp@smartchain.ai", hashed_password=get_password_hash("emp123"), role="EMPLOYEE"),
        ]
        
        db.add_all(users)
        db.commit()
        print("Success: Users fixed with hashed passwords.")
        print("  - ajay_admin / admin123")
        print("  - manager1 / manager123")
    except Exception as e:
        print(f"Error: Error fixing users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_users()
