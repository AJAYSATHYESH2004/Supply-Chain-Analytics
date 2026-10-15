from app.db.session import SessionLocal
from app.models import models
from app.core import security

def verify_db():
    db = SessionLocal()
    try:
        print("Checking UserAccounts:")
        accounts = db.query(models.UserAccount).all()
        for acc in accounts:
            print(f"User: {acc.username}, Email: {acc.email}, Role: {acc.role}, Active: {acc.is_active}, Failed: {acc.failed_attempts}")
            # Test password check for admin
            if acc.username == 'admin':
                is_correct = security.verify_password('admin123', acc.password_hash)
                print(f"  Password 'admin123' check: {is_correct}")
        
        if not accounts:
            print("No UserAccounts found!")

        print("\nChecking Users:")
        users = db.query(models.User).all()
        for u in users:
             print(f"User: {u.username}, Role: {u.role}")

    finally:
        db.close()

if __name__ == "__main__":
    verify_db()
