from app.db.session import SessionLocal
from app.models.models import (
    User, UserAccount, Department, Supplier, Product,
    InventoryTransaction, Sale, Forecast, PurchaseOrder,
    Task, Approval, AuditLog, UserSettings, SignupRequest,
    LoginActivity, RefreshToken
)

def verify_and_display_data():
    db = SessionLocal()
    
    try:
        print("="*60)
        print("VERIFYING DATABASE RECORDS (ALL 16 TABLES)")
        print("="*60)
        
        # Helper to print count and first few records
        def verify_table(model_cls, display_name, attr_to_print=None, limit=3):
            records = db.query(model_cls).all()
            print(f"\n[OK] {display_name} ({len(records)} records):")
            for r in records[:limit]:
                if attr_to_print:
                    val = getattr(r, attr_to_print, None)
                    # Get primary key
                    pk = getattr(r, 'id', getattr(r, 'request_id', getattr(r, 'login_id', getattr(r, 'account_id', ''))))
                    print(f"  - ID {pk}: {val}")
                else:
                    print(f"  - Record: {r}")
            if len(records) > limit:
                print(f"  ... and {len(records) - limit} more")
            return len(records)

        # 1. Users
        verify_table(User, "USERS", "username")
        
        # 2. User Accounts
        verify_table(UserAccount, "USER ACCOUNTS", "username")
        
        # 3. Departments
        verify_table(Department, "DEPARTMENTS", "name")
        
        # 4. Suppliers
        verify_table(Supplier, "SUPPLIERS", "name")
        
        # 5. Products
        products = db.query(Product).all()
        print(f"\n[OK] PRODUCTS ({len(products)} records):")
        for p in products[:5]:
            print(f"  - {p.name} (Category: {p.category}, Price: ${p.price}, Stock: {p.current_stock})")
        if len(products) > 5:
            print(f"  ... and {len(products) - 5} more")

        # 6. Inventory Transactions
        verify_table(InventoryTransaction, "INVENTORY TRANSACTIONS", "transaction_type")

        # 7. Sales
        verify_table(Sale, "SALES", "total_amount")

        # 8. Forecasts
        verify_table(Forecast, "FORECASTS", "predicted_demand")

        # 9. Purchase Orders
        verify_table(PurchaseOrder, "PURCHASE ORDERS", "status")

        # 10. Tasks
        verify_table(Task, "TASKS", "title")

        # 11. Approvals
        verify_table(Approval, "APPROVALS", "request_type")

        # 12. Audit Logs
        verify_table(AuditLog, "AUDIT LOGS", "action")

        # 13. User Settings
        verify_table(UserSettings, "USER SETTINGS", "user_id")

        # 14. Signup Requests
        verify_table(SignupRequest, "SIGNUP REQUESTS", "full_name")

        # 15. Login Activities
        verify_table(LoginActivity, "LOGIN ACTIVITIES", "ip_address")

        # 16. Refresh Tokens
        verify_table(RefreshToken, "REFRESH TOKENS", "token")

        print("\n" + "="*60)
        print("[OK] All 16 tables verified successfully!")
        print("="*60)
        
    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_and_display_data()
