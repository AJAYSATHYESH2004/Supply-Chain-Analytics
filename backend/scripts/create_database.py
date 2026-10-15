import pymysql
from urllib.parse import quote

# Connection details
host = "localhost"
user = "root"
password = "Ajay@2004"
database = "supply_chain_db"

try:
    # Connect to MySQL without specifying a database to create it
    connection = pymysql.connect(
        host=host,
        user=user,
        password=password
    )
    cursor = connection.cursor()
    
    print(f"Connected to MySQL server...")
    
    # Create database if it doesn't exist
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database}")
    print(f"[OK] Database '{database}' created or already exists")
    
    connection.commit()
    cursor.close()
    connection.close()
    
    print("\nNow run: python insert_records.py")
    
except Exception as e:
    print(f"[ERROR] Error: {str(e)}")

