from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Atlas connection string
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://lucifers_database:LuciFeR_DB@cluster0.ntfbm.mongodb.net/jewelry_db?retryWrites=true&w=majority')

# Create MongoDB client
client = MongoClient(MONGODB_URI)

# Get database
db = client.jewelry_db

def get_collection(collection_name):
    """Get a collection from the database"""
    return db[collection_name]

def close_connection():
    """Close the MongoDB connection"""
    client.close()

def test_connection():
    """Test the MongoDB connection"""
    try:
        # The ismaster command is cheap and does not require auth
        client.admin.command('ping')
        print("MongoDB connection successful!")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False

# Initialize collections
users = get_collection('users')
items = get_collection('items')
categories = get_collection('categories')
materials = get_collection('materials')
orders = get_collection('orders')
customers = get_collection('customers')
shop_info = get_collection('shop_info')
notification_settings = get_collection('notification_settings') 
print(users)
print(test_connection())