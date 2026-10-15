from app.db.session import SessionLocal
from app.models import models
from app.core import security

def fix_auth():
    db = SessionLocal()
    try:
        # Delete existing conflicting users if needed, or just update
        # Let's ensure 'admin' exists with 'admin123'
        admin_acc = db.query(models.UserAccount).filter(models.UserAccount.username == 'admin').first()
        if admin_acc:
            admin_acc.password_hash = security.get_password_hash('admin123')
            admin_acc.is_active = 1
            admin_acc.failed_attempts = 0
            db.commit()
            print("Updated existing admin account password to 'admin123'")
        else:
            # Maybe it exists under a different username?
            print("Admin account not found by username 'admin'. Creating it...")
            # Create user first
            user = db.query(models.User).filter(models.User.username == 'admin').first()
            if not user:
                user = models.User(username='admin', email='admin@smartchain.ai', hashed_password='dummy', role=models.UserRole.SUPER_ADMIN)
                db.add(user)
                db.commit()
                db.refresh(user)
            
            acc = models.UserAccount(
                user_id=user.id,
                username='admin',
                email='admin@smartchain.ai',
                password_hash=security.get_password_hash('admin123'),
                role=models.UserRole.SUPER_ADMIN,
                is_active=1
            )
            db.add(acc)
            db.commit()
            print("Created new admin account with 'admin123'")

        # Do the same for others to be safe
        others = [
            ('hod', 'hod123', models.UserRole.HOD),
            ('manager', 'manager123', models.UserRole.MANAGER),
            ('employee', 'employee123', models.UserRole.EMPLOYEE)
        ]
        
        for username, password, role in others:
            acc = db.query(models.UserAccount).filter(models.UserAccount.username == username).first()
            if acc:
                acc.password_hash = security.get_password_hash(password)
                acc.is_active = 1
                acc.failed_attempts = 0
                db.commit()
            else:
                user = db.query(models.User).filter(models.User.username == username).first()
                if not user:
                    user = models.User(username=username, email=f"{username}@smartchain.ai", hashed_password='dummy', role=role)
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                
                acc = models.UserAccount(user_id=user.id, username=username, email=user.email, password_hash=security.get_password_hash(password), role=role, is_active=1)
                db.add(acc)
                db.commit()
        
        print("Auth fix complete.")

    finally:
        db.close()

if __name__ == "__main__":
    fix_auth()
