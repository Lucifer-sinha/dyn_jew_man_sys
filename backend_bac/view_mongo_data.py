from pymongo import MongoClient
from bson import ObjectId
import json
from datetime import datetime

# MongoDB Atlas Configuration
MONGODB_URI = "mongodb+srv://lucifers_database:LuciFeR_DB@cluster0.ntfbm.mongodb.net/jewelry_db?retryWrites=true&w=majority"
client = MongoClient(MONGODB_URI)
db = client.jewelry_db

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def print_collection_data(collection_name):
    print(f"\n{'='*50}")
    print(f"Collection: {collection_name}")
    print(f"{'='*50}")
    
    collection = db[collection_name]
    documents = list(collection.find())
    
    if not documents:
        print("No documents found")
        return
    
    print(f"Total documents: {len(documents)}")
    print("\nDocuments:")
    for doc in documents:
        print(json.dumps(doc, indent=2, cls=CustomJSONEncoder))
        print("-" * 30)

def main():
    collections = [
        'users',
        'shop_info',
        'notification_settings',
        'items',
        'category',
        'material',
        'customers',
        'orders',
        'order_items',
        'user_settings'
    ]
    
    for collection in collections:
        print_collection_data(collection)

if __name__ == "__main__":
    main() 