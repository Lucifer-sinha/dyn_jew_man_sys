import mysql.connector
from supabase import create_client
import os
from dotenv import load_dotenv
from datetime import datetime
import json
from decimal import Decimal

# Load environment variables
load_dotenv()

# MySQL Configuration
mysql_config = {
    "host": "localhost",
    "user": "root",
    "password": "8520",
    "database": "jewelry_db"
}

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def connect_mysql():
    """Connect to MySQL database"""
    try:
        conn = mysql.connector.connect(**mysql_config)
        print("MySQL Connected Successfully!")
        return conn
    except Exception as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def connect_supabase():
    """Connect to Supabase"""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase Connected Successfully!")
        return supabase
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return None

def prepare_data_for_supabase(data):
    """Prepare data for Supabase insertion and remove 'id' field."""
    if isinstance(data, dict):
        # Remove 'id' field if present
        data = {k: v for k, v in data.items() if k != 'id'}
        # Convert Decimal to float
        for k, v in data.items():
            if isinstance(v, Decimal):
                data[k] = float(v)
            elif isinstance(v, datetime):
                data[k] = v.isoformat()
            elif isinstance(v, dict):
                data[k] = prepare_data_for_supabase(v)
            elif isinstance(v, list):
                data[k] = [prepare_data_for_supabase(item) for item in v]
        return data
    elif isinstance(data, list):
        return [prepare_data_for_supabase(item) for item in data]
    elif isinstance(data, datetime):
        return data.isoformat()
    elif isinstance(data, (int, float, str, bool, type(None))):
        return data
    else:
        return str(data)

def print_record_details(table_name, record):
    """Print detailed information about a record"""
    print(f"\n=== {table_name} Record Details ===")
    print("Original Record:", record)
    cleaned_record = prepare_data_for_supabase(record)
    print("Cleaned Record:", cleaned_record)
    print("=" * 50)

def insert_with_error_handling(supabase, table_name, record, record_id=None):
    """Insert a record with detailed error handling"""
    try:
        cleaned_record = prepare_data_for_supabase(record)
        print(f"\nAttempting to insert into {table_name}:")
        print("Data being sent:", json.dumps(cleaned_record, indent=2))
        
        # Convert the record to a list for Supabase
        data = [cleaned_record]
        
        result = supabase.table(table_name).insert(data).execute()
        print(f"Successfully inserted {table_name} record")
        return True
    except Exception as e:
        print(f"\nError inserting {table_name} record:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Record ID: {record_id}")
        print(f"Record data: {json.dumps(cleaned_record, indent=2)}")
        return False

def insert_data():
    """Insert data from MySQL to Supabase in correct order"""
    mysql_conn = connect_mysql()
    if not mysql_conn:
        return
    
    supabase = connect_supabase()
    if not supabase:
        return
    
    try:
        cursor = mysql_conn.cursor(dictionary=True)
        
        # 1. Insert categories (parent-first order)
        print("\n=== Inserting Categories ===")
        cursor.execute("SELECT * FROM category ORDER BY parent_id IS NULL DESC")
        categories = cursor.fetchall()
        
        # First pass: Insert root categories (no parent)
        for category in categories:
            if not category.get('parent_id'):
                print_record_details("Category", category)
                insert_with_error_handling(supabase, 'category', category, category.get('name'))
        
        # Second pass: Insert child categories
        for category in categories:
            if category.get('parent_id'):
                print_record_details("Category", category)
                insert_with_error_handling(supabase, 'category', category, category.get('name'))
        
        # 2. Insert materials
        print("\n=== Inserting Materials ===")
        cursor.execute("SELECT * FROM material")
        materials = cursor.fetchall()
        for material in materials:
            print_record_details("Material", material)
            insert_with_error_handling(supabase, 'material', material, material.get('name'))
        
        # 3. Insert customers
        print("\n=== Inserting Customers ===")
        cursor.execute("SELECT * FROM customers")
        customers = cursor.fetchall()
        for customer in customers:
            print_record_details("Customer", customer)
            insert_with_error_handling(supabase, 'customers', customer, customer.get('name'))
        
        # 4. Insert users
        print("\n=== Inserting Users ===")
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        for user in users:
            print_record_details("User", user)
            insert_with_error_handling(supabase, 'users', user, user.get('username'))
        
        # 5. Insert items
        print("\n=== Inserting Items ===")
        cursor.execute("SELECT * FROM items")
        items = cursor.fetchall()
        for item in items:
            print_record_details("Item", item)
            insert_with_error_handling(supabase, 'items', item, item.get('name'))
        
        # 6. Insert orders
        print("\n=== Inserting Orders ===")
        cursor.execute("SELECT * FROM orders")
        orders = cursor.fetchall()
        for order in orders:
            print_record_details("Order", order)
            insert_with_error_handling(supabase, 'orders', order, order.get('id'))
        
        # 7. Insert order items
        print("\n=== Inserting Order Items ===")
        cursor.execute("SELECT * FROM order_items")
        order_items = cursor.fetchall()
        for order_item in order_items:
            print_record_details("Order Item", order_item)
            insert_with_error_handling(supabase, 'order_items', order_item, order_item.get('id'))
        
        # 8. Insert notification settings
        print("\n=== Inserting Notification Settings ===")
        cursor.execute("SELECT * FROM notification_settings")
        notification_settings = cursor.fetchall()
        for setting in notification_settings:
            print_record_details("Notification Settings", setting)
            insert_with_error_handling(supabase, 'notification_settings', setting, setting.get('user_id'))
        
        # 9. Insert shop info
        print("\n=== Inserting Shop Info ===")
        cursor.execute("SELECT * FROM shop_info")
        shop_info = cursor.fetchall()
        for info in shop_info:
            print_record_details("Shop Info", info)
            insert_with_error_handling(supabase, 'shop_info', info, info.get('name'))
        
        # 10. Insert user settings
        print("\n=== Inserting User Settings ===")
        cursor.execute("SELECT * FROM user_settings")
        user_settings = cursor.fetchall()
        for setting in user_settings:
            print_record_details("User Settings", setting)
            insert_with_error_handling(supabase, 'user_settings', setting, setting.get('user_id'))
        
        print("\nData migration completed!")
        
    except Exception as e:
        print(f"\nError during data migration: {str(e)}")
    finally:
        if mysql_conn:
            mysql_conn.close()

if __name__ == "__main__":
    insert_data() 