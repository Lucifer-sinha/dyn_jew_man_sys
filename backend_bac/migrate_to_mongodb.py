import mysql.connector
from mongodb_config import *
from datetime import datetime
import json
from bson import ObjectId
import sys

def connect_mysql():
    """Connect to MySQL database"""
    try:
        return mysql.connector.connect(
            host="localhost",
            user="root",
            password="8520",
            database="jewelry_db",
            auth_plugin='mysql_native_password'
        )
    except Exception as e:
        print(f"Error connecting to MySQL: {str(e)}")
        sys.exit(1)

def migrate_users(mysql_conn):
    """Migrate users data"""
    try:
        cursor = mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users")
        users_data = cursor.fetchall()
        
        for user in users_data:
            # Convert MySQL datetime to MongoDB datetime
            if user.get('last_login'):
                user['last_login'] = datetime.fromisoformat(str(user['last_login']))
            if user.get('created_at'):
                user['created_at'] = datetime.fromisoformat(str(user['created_at']))
            
            # Insert into MongoDB
            users.insert_one(user)
        
        cursor.close()
        print(f"✓ Migrated {len(users_data)} users")
    except Exception as e:
        print(f"Error migrating users: {str(e)}")
        raise

def migrate_items(mysql_conn):
    """Migrate items data"""
    try:
        cursor = mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM items")
        items_data = cursor.fetchall()
        
        for item in items_data:
            # Convert decimal to float for MongoDB
            if 'price' in item:
                item['price'] = float(item['price'])
            if 'weight' in item:
                item['weight'] = float(item['weight'])
            
            # Convert datetime
            if item.get('created_at'):
                item['created_at'] = datetime.fromisoformat(str(item['created_at']))
            
            # Insert into MongoDB
            items.insert_one(item)
        
        cursor.close()
        print(f"✓ Migrated {len(items_data)} items")
    except Exception as e:
        print(f"Error migrating items: {str(e)}")
        raise

def migrate_categories(mysql_conn):
    """Migrate categories data"""
    try:
        cursor = mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM category")
        categories_data = cursor.fetchall()
        
        for category in categories_data:
            # Insert into MongoDB
            categories.insert_one(category)
        
        cursor.close()
        print(f"✓ Migrated {len(categories_data)} categories")
    except Exception as e:
        print(f"Error migrating categories: {str(e)}")
        raise

def migrate_materials(mysql_conn):
    """Migrate materials data"""
    try:
        cursor = mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM material")
        materials_data = cursor.fetchall()
        
        for material in materials_data:
            # Insert into MongoDB
            materials.insert_one(material)
        
        cursor.close()
        print(f"✓ Migrated {len(materials_data)} materials")
    except Exception as e:
        print(f"Error migrating materials: {str(e)}")
        raise

def migrate_orders(mysql_conn):
    """Migrate orders and order items data"""
    try:
        cursor = mysql_conn.cursor(dictionary=True)
        
        # Get orders
        cursor.execute("SELECT * FROM orders")
        orders_data = cursor.fetchall()
        
        for order in orders_data:
            # Convert decimal to float
            if 'total_price' in order:
                order['total_price'] = float(order['total_price'])
            
            # Convert datetime
            if order.get('order_date'):
                order['order_date'] = datetime.fromisoformat(str(order['order_date']))
            
            # Get order items
            cursor.execute("SELECT * FROM order_items WHERE order_id = %s", (order['id'],))
            order_items = cursor.fetchall()
            
            # Convert order items
            for item in order_items:
                if 'price' in item:
                    item['price'] = float(item['price'])
            
            # Add order items to order document
            order['items'] = order_items
            
            # Insert into MongoDB
            orders.insert_one(order)
        
        cursor.close()
        print(f"✓ Migrated {len(orders_data)} orders")
    except Exception as e:
        print(f"Error migrating orders: {str(e)}")
        raise

def migrate_customers(mysql_conn):
    """Migrate customers data"""
    try:
        cursor = mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM customers")
        customers_data = cursor.fetchall()
        
        for customer in customers_data:
            # Convert datetime
            if customer.get('created_at'):
                customer['created_at'] = datetime.fromisoformat(str(customer['created_at']))
            
            # Insert into MongoDB
            customers.insert_one(customer)
        
        cursor.close()
        print(f"✓ Migrated {len(customers_data)} customers")
    except Exception as e:
        print(f"Error migrating customers: {str(e)}")
        raise

def migrate_shop_info(mysql_conn):
    """Migrate shop info data"""
    try:
        cursor = mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM shop_info")
        shop_info_data = cursor.fetchall()
        
        for info in shop_info_data:
            # Convert datetime
            if info.get('created_at'):
                info['created_at'] = datetime.fromisoformat(str(info['created_at']))
            if info.get('updated_at'):
                info['updated_at'] = datetime.fromisoformat(str(info['updated_at']))
            
            # Insert into MongoDB
            shop_info.insert_one(info)
        
        cursor.close()
        print(f"✓ Migrated {len(shop_info_data)} shop info records")
    except Exception as e:
        print(f"Error migrating shop info: {str(e)}")
        raise

def migrate_notification_settings(mysql_conn):
    """Migrate notification settings data"""
    try:
        cursor = mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM notification_settings")
        settings_data = cursor.fetchall()
        
        for setting in settings_data:
            # Parse JSON settings
            if 'settings' in setting:
                setting['settings'] = json.loads(setting['settings'])
            
            # Convert datetime
            if setting.get('created_at'):
                setting['created_at'] = datetime.fromisoformat(str(setting['created_at']))
            if setting.get('updated_at'):
                setting['updated_at'] = datetime.fromisoformat(str(setting['updated_at']))
            
            # Insert into MongoDB
            notification_settings.insert_one(setting)
        
        cursor.close()
        print(f"✓ Migrated {len(settings_data)} notification settings")
    except Exception as e:
        print(f"Error migrating notification settings: {str(e)}")
        raise

def migrate_integration_settings(mysql_conn):
    """Migrate integration settings data"""
    try:
        cursor = mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM integration_settings")
        settings_data = cursor.fetchall()
        
        for setting in settings_data:
            # Convert datetime
            if setting.get('created_at'):
                setting['created_at'] = datetime.fromisoformat(str(setting['created_at']))
            if setting.get('updated_at'):
                setting['updated_at'] = datetime.fromisoformat(str(setting['updated_at']))
            
            # Insert into MongoDB
            db.integration_settings.insert_one(setting)
        
        cursor.close()
        print(f"✓ Migrated {len(settings_data)} integration settings")
    except Exception as e:
        print(f"Error migrating integration settings: {str(e)}")
        raise

def create_indexes():
    """Create necessary indexes in MongoDB collections"""
    try:
        # Users collection indexes
        users.create_index('username', unique=True)
        users.create_index('email', unique=True)
        
        # Items collection indexes
        items.create_index('unique_id', unique=True)
        items.create_index('category_id')
        items.create_index('material_id')
        
        # Orders collection indexes
        orders.create_index('customer_id')
        orders.create_index('order_date')
        
        # Categories collection indexes
        categories.create_index('parent_id')
        
        # Customers collection indexes
        customers.create_index('contact', unique=True)
        customers.create_index('email', unique=True)
        
        print("✓ Created all necessary indexes")
    except Exception as e:
        print(f"Error creating indexes: {str(e)}")
        raise

def main():
    """Main migration function"""
    print("\nStarting MongoDB Migration...")
    print("=============================")
    
    try:
        # Connect to MySQL
        mysql_conn = connect_mysql()
        print("✓ Connected to MySQL database")
        
        # Test MongoDB connection
        if not test_connection():
            raise Exception("Failed to connect to MongoDB")
        print("✓ Connected to MongoDB")
        
        # Clear existing MongoDB collections
        print("\nClearing existing collections...")
        users.delete_many({})
        items.delete_many({})
        categories.delete_many({})
        materials.delete_many({})
        orders.delete_many({})
        customers.delete_many({})
        shop_info.delete_many({})
        notification_settings.delete_many({})
        db.integration_settings.delete_many({})
        print("✓ Cleared all collections")
        
        # Migrate data
        print("\nMigrating data...")
        migrate_users(mysql_conn)
        migrate_items(mysql_conn)
        migrate_categories(mysql_conn)
        migrate_materials(mysql_conn)
        migrate_orders(mysql_conn)
        migrate_customers(mysql_conn)
        migrate_shop_info(mysql_conn)
        migrate_notification_settings(mysql_conn)
        migrate_integration_settings(mysql_conn)
        
        # Create indexes
        print("\nCreating indexes...")
        create_indexes()
        
        print("\n✓ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during migration: {str(e)}")
        sys.exit(1)
    finally:
        if 'mysql_conn' in locals():
            mysql_conn.close()
        close_connection()

if __name__ == "__main__":
    main() 