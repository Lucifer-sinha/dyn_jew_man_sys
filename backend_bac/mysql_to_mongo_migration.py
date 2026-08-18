from flask import Flask
from flask_mysqldb import MySQL
from pymongo import MongoClient
import datetime
from bson import ObjectId
import json

app = Flask(__name__)

# MySQL Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = '8520'
app.config['MYSQL_DB'] = 'jewelry_db'
mysql = MySQL(app)

# MongoDB Atlas Configuration
MONGODB_URI = "mongodb+srv://lucifers_database:LuciFeR_DB@cluster0.ntfbm.mongodb.net/jewelry_db?retryWrites=true&w=majority"
client = MongoClient(MONGODB_URI)
db = client.jewelry_db

def convert_mysql_to_mongo():
    try:
        # Drop existing collections
        print("Dropping existing collections...")
        collections = [
            'users', 'shop_info', 'notification_settings', 'items',
            'category', 'material', 'customers', 'orders',
            'order_items', 'user_settings'
        ]
        for collection in collections:
            db[collection].drop()
            print(f"Dropped {collection} collection")

        # Get MySQL cursor
        cur = mysql.connection.cursor()
        
        # Create a mapping of MySQL IDs to MongoDB ObjectIds
        id_mapping = {}
        
        # Migrate users table
        print("Migrating users table...")
        cur.execute("SELECT * FROM users")
        users = cur.fetchall()
        for user in users:
            mysql_id = user[0]
            mongo_id = ObjectId()
            id_mapping[mysql_id] = mongo_id
            
            user_doc = {
                "_id": mongo_id,
                "username": user[1],
                "email": user[2],
                "password_hash": user[3],
                "role": user[4],
                "last_login": user[5],
                "created_at": user[6]
            }
            db.users.insert_one(user_doc)
        
        # Migrate shop_info table
        print("Migrating shop_info table...")
        cur.execute("SELECT * FROM shop_info")
        shop_info = cur.fetchall()
        for shop in shop_info:
            shop_doc = {
                "_id": 1,
                "name": shop[1],
                "email": shop[2],
                "contact": shop[3],
                "address": shop[4],
                "created_at": shop[5]
            }
            db.shop_info.insert_one(shop_doc)
        
        # Migrate notification_settings table
        print("Migrating notification_settings table...")
        cur.execute("SELECT * FROM notification_settings")
        notification_settings = cur.fetchall()
        for setting in notification_settings:
            mysql_user_id = setting[1]
            mongo_user_id = id_mapping.get(mysql_user_id)
            
            if mongo_user_id:
                setting_doc = {
                    "_id": ObjectId(),
                    "user_id": mongo_user_id,
                    "settings": json.loads(setting[2]),
                    "created_at": setting[3],
                    "updated_at": setting[4]
                }
                db.notification_settings.insert_one(setting_doc)
        
        # Migrate items table
        print("Migrating items table...")
        cur.execute("SELECT * FROM items")
        items = cur.fetchall()
        for item in items:
            mysql_id = item[0]
            mongo_id = ObjectId()
            id_mapping[mysql_id] = mongo_id
            
            item_doc = {
                "_id": mongo_id,
                "unique_id": item[1],
                "name": item[2],
                "category_id": id_mapping.get(item[3]) if item[3] else None,
                "material_id": id_mapping.get(item[4]) if item[4] else None,
                "price": float(item[5]) if item[5] else 0.0,
                "weight": float(item[6]) if item[6] else None,
                "stock": item[7],
                "description": item[8],
                "image_url": item[9],
                "sold_count": item[10],
                "created_at": item[11]
            }
            db.items.insert_one(item_doc)
        
        # Migrate category table
        print("Migrating category table...")
        cur.execute("SELECT * FROM category")
        categories = cur.fetchall()
        for category in categories:
            mysql_id = category[0]
            mongo_id = ObjectId()
            id_mapping[mysql_id] = mongo_id
            
            category_doc = {
                "_id": mongo_id,
                "name": category[1],
                "parent_id": id_mapping.get(category[2]) if category[2] else None,
                "sort_order": category[3] if len(category) > 3 else 0,
                "visibility": bool(category[4]) if len(category) > 4 else True,
                "created_at": datetime.datetime.now()
            }
            db.category.insert_one(category_doc)
        
        # Migrate material table
        print("Migrating material table...")
        cur.execute("SELECT * FROM material")
        materials = cur.fetchall()
        for material in materials:
            mysql_id = material[0]
            mongo_id = ObjectId()
            id_mapping[mysql_id] = mongo_id
            
            material_doc = {
                "_id": mongo_id,
                "name": material[1],
                "created_at": material[2] if len(material) > 2 else datetime.datetime.now()
            }
            db.material.insert_one(material_doc)
        
        # Migrate customers table
        print("Migrating customers table...")
        cur.execute("SELECT * FROM customers")
        customers = cur.fetchall()
        for customer in customers:
            mysql_id = customer[0]
            mongo_id = ObjectId()
            id_mapping[mysql_id] = mongo_id
            
            customer_doc = {
                "_id": mongo_id,
                "name": customer[1],
                "contact": customer[2],
                "email": customer[3],
                "address": customer[4],
                "created_at": customer[5] if len(customer) > 5 else datetime.datetime.now()
            }
            db.customers.insert_one(customer_doc)
        
        # Migrate orders table
        print("Migrating orders table...")
        cur.execute("SELECT * FROM orders")
        orders = cur.fetchall()
        for order in orders:
            mysql_id = order[0]
            mongo_id = ObjectId()
            id_mapping[mysql_id] = mongo_id
            
            order_doc = {
                "_id": mongo_id,
                "customer_id": id_mapping.get(order[1]),
                "total_price": float(order[2]) if order[2] else 0.0,
                "payment_method": order[3],
                "order_date": order[4],
                "status": order[5] if len(order) > 5 else "pending"
            }
            db.orders.insert_one(order_doc)
        
        # Migrate order_items table
        print("Migrating order_items table...")
        cur.execute("SELECT * FROM order_items")
        order_items = cur.fetchall()
        for order_item in order_items:
            mysql_id = order_item[0]
            mongo_id = ObjectId()
            id_mapping[mysql_id] = mongo_id
            
            order_item_doc = {
                "_id": mongo_id,
                "order_id": id_mapping.get(order_item[1]),
                "item_id": id_mapping.get(order_item[2]),
                "quantity": order_item[3],
                "price": float(order_item[4]) if order_item[4] else 0.0,
                "created_at": order_item[5] if len(order_item) > 5 else datetime.datetime.now()
            }
            db.order_items.insert_one(order_item_doc)
        
        # Migrate user_settings table
        print("Migrating user_settings table...")
        cur.execute("SELECT * FROM user_settings")
        user_settings = cur.fetchall()
        for setting in user_settings:
            mysql_id = setting[0]
            mongo_id = ObjectId()
            id_mapping[mysql_id] = mongo_id
            
            setting_doc = {
                "_id": mongo_id,
                "user_id": id_mapping.get(setting[1]),
                "language": setting[2],
                "currency": setting[3],
                "timezone": setting[4],
                "date_format": setting[5],
                "created_at": setting[6] if len(setting) > 6 else datetime.datetime.now(),
                "updated_at": setting[7] if len(setting) > 7 else datetime.datetime.now()
            }
            db.user_settings.insert_one(setting_doc)
        
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        raise e
    finally:
        cur.close()

if __name__ == '__main__':
    with app.app_context():
        convert_mysql_to_mongo() 