from flask import Flask, request, jsonify, send_file, send_from_directory, make_response
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_mail import Mail, Message
from reportlab.pdfgen import canvas
import os
import requests
from werkzeug.utils import secure_filename
import datetime
import json
from decimal import Decimal
from bson import ObjectId, Decimal128
from bson.errors import InvalidId
import pymongo
from pymongo import MongoClient
from models import NotificationSettings, IntegrationSettings

# NEW imports for auth
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import bcrypt

app = Flask(__name__)
app.secret_key = "mysecret"  # Required for session-based auth

# Configure CORS to allow credentials
CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "https://jewelry-management-system.pages.dev",
    r"https://.*\.pages\.dev"
], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], allow_headers=["Content-Type", "Authorization"], expose_headers=["Content-Type", "Authorization"], max_age=3600)


socketio = SocketIO(app, cors_allowed_origins="*")

# MongoDB Atlas Configuration
# Replace this with your MongoDB Atlas connection string
MONGODB_URI = "mongodb+srv://lucifers_database:LuciFeR_DB@cluster0.ntfbm.mongodb.net/jewelry_db?retryWrites=true&w=majority"
client = MongoClient(MONGODB_URI)
db = client.jewelry_db

# Collections
users_collection = db.users
shop_info_collection = db.shop_info
notification_settings_collection = db.notification_settings
items_collection = db.items
category_collection = db.category
material_collection = db.material
customers_collection = db.customers
orders_collection = db.orders
order_items_collection = db.order_items
user_settings_collection = db.user_settings

# Flask-Login Manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.session_protection = 'strong'

# In-memory cart storage (temporary)
cart = {}

# Folder for product images
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # path to 'backend'
UPLOAD_FOLDER = os.path.join(BASE_DIR, '..', 'product_img')

# Configure Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your-email@gmail.com'  # Replace with your email
app.config['MAIL_PASSWORD'] = 'your-app-password'     # Replace with your app password
mail = Mail(app)

# Custom JSON encoder to handle Decimal, datetime, and ObjectId types
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, Decimal128):
            return float(str(obj))
        return super(CustomJSONEncoder, self).default(obj)

# Set the custom JSON encoder for Flask
app.json_encoder = CustomJSONEncoder

# Helper function to safely convert to ObjectId
def to_object_id(id_value):
    if id_value is None:
        return None
    try:
        # If it's already an ObjectId, return it
        if isinstance(id_value, ObjectId):
            return id_value
        # If it's a string, try to convert directly
        if isinstance(id_value, str):
            # Remove any whitespace
            id_value = id_value.strip()
            # Check if it's a valid 24-character hex string
            if len(id_value) == 24 and all(c in '0123456789abcdef' for c in id_value.lower()):
                return ObjectId(id_value)
            else:
                print(f"Invalid ObjectId string format: {id_value}")
                return None
        # For numbers or other types, convert to string first
        return ObjectId(str(id_value))
    except (InvalidId, TypeError) as e:
        print(f"Error converting to ObjectId: {str(e)}, value: {id_value}, type: {type(id_value)}")
        return None

# --------------------------
# Flask-Login User class
# --------------------------
class User(UserMixin):
    def __init__(self, user_id, username, role):
        self.id = user_id
        self.username = username
        self.role = role

    def get_id(self):
        return str(self.id)

@login_manager.user_loader
def load_user(user_id):
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            return User(str(user['_id']), user['username'], user['role'])
    except InvalidId:
        pass
    return None

# --------------------------
# Database Initialization
# --------------------------
def initialize_database():
    """Create necessary indexes and default data if they don't exist"""
    try:
        # Create indexes
        users_collection.create_index("username", unique=True)
        users_collection.create_index("email", unique=True)
        items_collection.create_index("unique_id", unique=True)
        items_collection.create_index("name")
        category_collection.create_index("name")
        notification_settings_collection.create_index("user_id", unique=True)
        
        # Check if there's an admin user, create default if none
        admin_count = users_collection.count_documents({"role": "admin"})
        
        if admin_count == 0:
            # Create default admin user (username: admin, password: admin123)
            hashed_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            users_collection.insert_one({
                "username": "admin",
                "email": "admin@example.com",
                "password_hash": hashed_password,
                "role": "admin",
                "last_login": None,
                "created_at": datetime.datetime.now()
            })
        
        print("Database initialization completed successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")

# Run database initialization when the app starts
with app.app_context():
    initialize_database()

# Add a test endpoint to check if API is working
@app.route('/api_test', methods=['GET'])
def api_test():
    """Simple endpoint to test if API is working"""
    return jsonify({
        'status': 'success',
        'message': 'API is working correctly',
        'timestamp': datetime.datetime.now().isoformat()
    })

@app.route('/setup', methods=['POST'])
def setup():
    name = request.form.get('name')
    contact = request.form.get('contact')
    email = request.form.get('email')
    address = request.form.get('address')
    logo = request.files.get('logo')

    # Save logo
    if logo:
        filename = secure_filename(logo.filename)
        path = os.path.join('static/logos', filename)
        logo.save(path)

        # Save to DB
        shop_info_collection.insert_one({
            "name": name,
            "contact": contact,
            "email": email,
            "address": address,
            "created_at": datetime.datetime.now()
        })
        return jsonify({"message": "Saved"}), 200

    return jsonify({"error": "Missing data"}), 400

# --------------------------
# Login Endpoint
# --------------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    user = users_collection.find_one({"username": username})

    if not user:
        return jsonify({"error": "Invalid username or password"}), 401

    if bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        # Update last login
        users_collection.update_one(
            {"_id": user['_id']},
            {"$set": {"last_login": datetime.datetime.now()}}
        )
        
        user_obj = User(str(user['_id']), user['username'], user['role'])
        login_user(user_obj)
        return jsonify({"message": "Login successful", "role": user['role']})
    else:
        return jsonify({"error": "Invalid username or password"}), 401

# --------------------------
# Signup / Register Endpoint
# --------------------------
@app.route('/signup', methods=['POST'])
@app.route('/register', methods=['POST'])
def signup():
    data = request.json or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'staff')

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password required"}), 400

    try:
        existing_user = db.users.find_one({
            "$or": [
                {"username": username},
                {"email": email}
            ]
        })
        
        if existing_user:
            return jsonify({'error': 'Username or email already exists'}), 400
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user_doc = {
            "username": username,
            "email": email,
            "password_hash": hashed_password,
            "role": role,
            "created_at": datetime.datetime.now(),
            "last_login": datetime.datetime.now()
        }
        
        result = db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        user_obj = User(user_id, username, role)
        login_user(user_obj)
        
        return jsonify({
            'message': 'Account created successfully',
            'id': user_id,
            'role': role
        }), 201
    except Exception as e:
        print(f"Error registering user: {e}")
        return jsonify({'error': str(e)}), 500


# --------------------------
# Logout Endpoint
# --------------------------
@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"})

# --------------------------
# Serve Uploaded Images
# --------------------------
@app.route('/product_img/<filename>')
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# --------------------------
# Upload Image Endpoint
# --------------------------
@app.route('/upload_image', methods=['POST'])
def upload_image():
    unique_id = request.form.get('unique_id')
    if 'image' not in request.files or not unique_id:
        return jsonify({'error': 'Image file or unique_id missing'}), 400

    file = request.files['image']
    filename = secure_filename(f"{unique_id}.jpg")
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    return jsonify({'message': 'Image uploaded', 'path': file_path})

@app.route('/autocomplete', methods=['GET'])
def autocomplete():
    q = request.args.get('q', '')
    items = items_collection.find(
        {"name": {"$regex": q, "$options": "i"}},
        {"_id": 1, "name": 1}
    ).limit(10)
    
    results = []
    for item in items:
        results.append({"id": str(item['_id']), "name": item['name']})
    
    return jsonify(results)

# --------------------------
# Metal Prices (API Call)
# --------------------------
@app.route('/get_metal_prices', methods=['GET'])
def get_metal_prices():
    try:
        url = (
            "https://api.metalpriceapi.com/v1/latest"
            "?api_key=c4a1edd3ec07675bc8e81aacdb46ff86"
            "&base=USD"
            "&currencies=XAU,XAG"
        )
        response = requests.get(url)
        data = response.json()

        if 'rates' not in data:
            print("MetalPriceAPI response missing 'rates':", data)
            return jsonify({
                "Gold": 5000,
                "Silver": 70
            })

        usd_to_inr = 82.0  # approximate conversion rate
        gold_oz_usd = float(data["rates"]["USDXAU"])
        silver_oz_usd = float(data["rates"]["USDXAG"])

        gold_oz_inr = gold_oz_usd * usd_to_inr
        silver_oz_inr = silver_oz_usd * usd_to_inr

        # 1 troy ounce = 31.1035 grams
        gold_g_inr = gold_oz_inr / 31.1035
        silver_g_inr = silver_oz_inr / 31.1035

        return jsonify({
            "Gold": round(gold_g_inr, 2),
            "Silver": round(silver_g_inr, 2)
        })
    except Exception as e:
        print("MetalPriceAPI exception:", str(e))
        return jsonify({
            "Gold": 5000,
            "Silver": 70
        })

# --------------------------
# Advanced Category Management Endpoints
# --------------------------
def get_category_tree():
    try:
        categories = list(category_collection.find({}).sort("sort_order", 1))
        
        # Convert ObjectIds to strings
        for cat in categories:
            cat['id'] = str(cat['_id'])
            if 'parent_id' in cat and cat['parent_id']:
                cat['parent_id'] = str(cat['parent_id'])
            cat['subcategories'] = []

        # Build a dictionary mapping id to category object
        cat_dict = {cat["id"]: cat for cat in categories}
        tree = []
        
        for cat in categories:
            if cat.get("parent_id"):
                parent = cat_dict.get(cat["parent_id"])
                if parent:
                    parent["subcategories"].append(cat)
            else:
                tree.append(cat)
        
        return tree
    except Exception as e:
        print(f"Error in get_category_tree: {str(e)}")
        return []

@app.route('/get_category_tree', methods=['GET'])
def fetch_category_tree():
    try:
        # Get all categories
        categories = list(category_collection.find({}).sort("sort_order", 1))
        
        # Convert to list of dicts with string IDs
        categories_list = []
        for cat in categories:
            cat_dict = {
                "id": str(cat["_id"]),
                "name": cat.get("name", ""),
                "parent_id": str(cat.get("parent_id")) if cat.get("parent_id") else None,
                "sort_order": cat.get("sort_order", 0),
                "visibility": cat.get("visibility", True),
                "subcategories": []
            }
            categories_list.append(cat_dict)
        
        # Build tree
        cat_map = {cat["id"]: cat for cat in categories_list}
        root_categories = []
        
        for cat in categories_list:
            if cat["parent_id"] and cat["parent_id"] in cat_map:
                cat_map[cat["parent_id"]]["subcategories"].append(cat)
            else:
                root_categories.append(cat)
        
        return jsonify(root_categories)
    except Exception as e:
        print(f"Error in fetch_category_tree: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/category', methods=['POST'])
def add_category():
    data = request.json
    name = data.get("name")
    parent_id = data.get("parent_id")
    sort_order = data.get("sort_order", 0)
    visibility = data.get("visibility", True)

    if not name:
        return jsonify({"error": "Category name is required"}), 400

    try:
        category_doc = {
            "name": name,
            "sort_order": sort_order,
            "visibility": visibility,
            "created_at": datetime.datetime.now()
        }
        
        if parent_id:
            parent_obj_id = to_object_id(parent_id)
            if not parent_obj_id:
                return jsonify({"error": "Invalid parent_id"}), 400
            category_doc["parent_id"] = parent_obj_id
        
        category_collection.insert_one(category_doc)
        socketio.emit("update_categories", fetch_category_tree().get_json())
        return jsonify({"message": "Category added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/category/<category_id>', methods=['PUT'])
def update_category(category_id):
    data = request.json
    update_fields = {}

    if "name" in data:
        update_fields["name"] = data["name"]
    if "parent_id" in data:
        if data["parent_id"]:
            try:
                update_fields["parent_id"] = ObjectId(data["parent_id"])
            except InvalidId:
                return jsonify({"error": "Invalid parent_id"}), 400
        else:
            update_fields["parent_id"] = None
    if "sort_order" in data:
        update_fields["sort_order"] = data["sort_order"]
    if "visibility" in data:
        update_fields["visibility"] = data["visibility"]

    if not update_fields:
        return jsonify({"error": "No valid fields to update"}), 400

    try:
        result = category_collection.update_one(
            {"_id": ObjectId(category_id)},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Category not found"}), 404
            
        socketio.emit("update_categories", fetch_category_tree().get_json())
        return jsonify({"message": "Category updated successfully"})
    except InvalidId:
        return jsonify({"error": "Invalid category_id"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/category/<category_id>', methods=['DELETE'])
def delete_category(category_id):
    """Delete a category (and its subcategories via cascade)."""
    try:
        # First, find all subcategories recursively
        def get_all_subcategories(parent_id):
            subcats = list(category_collection.find({"parent_id": ObjectId(parent_id)}))
            all_subcats = subcats.copy()
            for subcat in subcats:
                all_subcats.extend(get_all_subcategories(str(subcat['_id'])))
            return all_subcats
        
        subcategories = get_all_subcategories(category_id)
        subcat_ids = [subcat['_id'] for subcat in subcategories]
        subcat_ids.append(ObjectId(category_id))
        
        # Delete all categories
        category_collection.delete_many({"_id": {"$in": subcat_ids}})
        
        socketio.emit("update_categories", fetch_category_tree().get_json())
        return jsonify({"message": "Category deleted successfully"})
    except InvalidId:
        return jsonify({"error": "Invalid category_id"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------
# Get Materials Endpoint
# --------------------------
@app.route('/get_materials', methods=['GET'])
def get_materials():
    try:
        materials = list(material_collection.find({}, {"_id": 1, "name": 1}))
        result = []
        for mat in materials:
            result.append({
                "id": str(mat['_id']),
                "name": mat['name']
            })
        return jsonify(result)
    except Exception as e:
        print(f"Error in get_materials: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Helper: Recursively get full category path (parent → child)
def get_category_path(category_id):
    if not category_id:
        return []
    
    path = []
    current_id = category_id
    
    while current_id:
        try:
            if isinstance(current_id, str):
                current_id = ObjectId(current_id)
            
            category = category_collection.find_one({"_id": current_id})
            if not category:
                break
                
            path.insert(0, category['name'])
            current_id = category.get('parent_id')
        except InvalidId:
            break
    
    return path

@app.route('/get_item/<item_id>', methods=['GET'])
def get_item_details(item_id):
    try:
        item = items_collection.find_one({"_id": ObjectId(item_id)})
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        # Convert ObjectId to string
        item['id'] = str(item['_id'])
        del item['_id']
        
        # Convert category_id and material_id if they exist
        if 'category_id' in item and item['category_id']:
            item['category_id'] = str(item['category_id'])
        if 'material_id' in item and item['material_id']:
            item['material_id'] = str(item['material_id'])

        # Get category name and path
        if item.get('category_id'):
            category = category_collection.find_one({"_id": ObjectId(item['category_id'])})
            if category:
                item['category_name'] = category['name']
                item['parent_id'] = str(category['parent_id']) if category.get('parent_id') else None
                item['full_category_path'] = get_category_path(item['category_id'])

        return jsonify(item)

    except InvalidId:
        return jsonify({'error': 'Invalid item ID'}), 400
    except Exception as e:
        print("Error in get_item_details:", e)
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/get_items_by_category', methods=['GET'])
def get_items_by_category():
    category_id = request.args.get('category_id')

    if not category_id:
        return jsonify({'error': 'category_id is required'}), 400

    try:
        # Convert to ObjectId
        category_obj_id = ObjectId(category_id)
        
        # Verify the category exists
        category = category_collection.find_one({"_id": category_obj_id})
        
        if not category:
            return jsonify({'error': f'Category with ID {category_id} not found'}), 404

        # Get all categories for hierarchy traversal
        all_cats = list(category_collection.find({}, {"_id": 1, "parent_id": 1}))

        # Map parent categories to their children
        from collections import defaultdict, deque
        child_map = defaultdict(list)
        
        for cat in all_cats:
            if cat.get('parent_id'):
                child_map[cat['parent_id']].append(cat['_id'])

        # BFS to collect all categories (selected category + all descendants)
        all_category_ids = set([category_obj_id])
        to_visit = deque([category_obj_id])
        
        while to_visit:
            current_cat_id = to_visit.popleft()
            children = child_map.get(current_cat_id, [])
            
            for child_id in children:
                if child_id not in all_category_ids:
                    all_category_ids.add(child_id)
                    to_visit.append(child_id)
        
        # Fetch items from these category_ids
        items = list(items_collection.find({"category_id": {"$in": list(all_category_ids)}}))
        
        # Convert to JSON-friendly format        
        result = []
        for item in items:
            result.append({
                "id": str(item['_id']),
                "unique_id": item.get('unique_id'),
                "name": item.get('name'),
                "category_id": str(item.get('category_id')) if item.get('category_id') else None,
                "material_id": str(item.get('material_id')) if item.get('material_id') else None,
                "price": float(item.get('price', 0)),
                "weight": float(item.get('weight', 0)) if item.get('weight') else None,
                "stock": item.get('stock', 0),
                "description": item.get('description'),
                "image_url": item.get('image_url'),
                "sold_count": item.get('sold_count', 0),
                "created_at": item.get('created_at').isoformat() if item.get('created_at') else None
            })
        
        return jsonify(result)

    except InvalidId:
        return jsonify({'error': 'Invalid category ID format'}), 400
    except Exception as e:
        print(f"Error in get_items_by_category: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# --------------------------
# Get Items (with Sorting)
# --------------------------
@app.route('/get_items', methods=['GET'])
def get_items():
    try:
        sort = request.args.get('sort', '')
        sort_criteria = {}

        if sort == "price_asc":
            sort_criteria = {"price": 1}
        elif sort == "price_desc":
            sort_criteria = {"price": -1}
        elif sort == "most_sold":
            sort_criteria = {"sold_count": -1}
        elif sort == "new":
            sort_criteria = {"created_at": -1}
        else:
            sort_criteria = {"created_at": -1}  # Default sort

        items = list(items_collection.find({}).sort(list(sort_criteria.items())))
        items_list = []
        
        for item in items:
            try:
                item_dict = {
                    "id": str(item['_id']),
                    "unique_id": item.get('unique_id'),
                    "name": item.get('name'),
                    "category_id": str(item.get('category_id')) if item.get('category_id') else None,
                    "material_id": str(item.get('material_id')) if item.get('material_id') else None,
                    "price": float(str(item.get('price', 0))),  # Convert Decimal128 to float
                    "weight": float(str(item.get('weight', 0))) if item.get('weight') else None,  # Convert Decimal128 to float
                    "stock": int(item.get('stock', 0)),
                    "description": item.get('description'),
                    "image_url": item.get('image_url'),
                    "sold_count": int(item.get('sold_count', 0)),
                    "created_at": item.get('created_at').isoformat() if item.get('created_at') else None
                }
                items_list.append(item_dict)
            except Exception as e:
                print(f"Error processing item {item.get('_id')}: {str(e)}")
                continue
            
        return jsonify(items_list)
    except Exception as e:
        print(f"Error in get_items: {str(e)}")
        return jsonify({"error": str(e)}), 500

# --------------------------
# Search Items Endpoint
# --------------------------
@app.route('/search', methods=['GET'])
def search_items():
    q = request.args.get('q', '')
    items = items_collection.find({
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"unique_id": {"$regex": q, "$options": "i"}}
        ]
    })

    results = []
    for item in items:
        results.append({
            "id": str(item['_id']),
            "unique_id": item.get('unique_id'),
            "name": item.get('name'),
            "category_id": str(item.get('category_id')) if item.get('category_id') else None,
            "material_id": str(item.get('material_id')) if item.get('material_id') else None,
            "price": float(item.get('price', 0)),
            "weight": float(item.get('weight', 0)) if item.get('weight') else None,
            "stock": item.get('stock', 0),
            "description": item.get('description'),
            "image_url": item.get('image_url')
        })
    return jsonify(results)

# --------------------------
# Add Item (Require Login)
# --------------------------
@app.route('/add_item', methods=['POST'])
def add_item():
    data = request.json
    unique_id = data.get('unique_id')
    name = data.get('name')
    category_id = data.get('category_id')
    material_id = data.get('material_id')
    price = data.get('price')
    weight = data.get('weight')
    stock = data.get('stock')
    description = data.get('description')
    image_url = data.get('image_url')
    
    if not (unique_id and name and category_id and material_id and price is not None and stock is not None):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Debug log the incoming IDs
        print(f"Received category_id: {category_id} (type: {type(category_id)})")
        print(f"Received material_id: {material_id} (type: {type(material_id)})")

        # Convert IDs to ObjectId
        category_obj_id = to_object_id(category_id)
        material_obj_id = to_object_id(material_id)

        # Debug log the converted IDs
        print(f"Converted category_id: {category_obj_id}")
        print(f"Converted material_id: {material_obj_id}")

        if not category_obj_id:
            return jsonify({'error': f'Invalid category_id format: {category_id}'}), 400
        if not material_obj_id:
            return jsonify({'error': f'Invalid material_id format: {material_id}'}), 400

        # Validate category_id exists
        category = category_collection.find_one({"_id": category_obj_id})
        if not category:
            print(f"Category not found: {category_id}")
            return jsonify({'error': 'Category not found'}), 400
    
        # Validate material_id exists
        material = material_collection.find_one({"_id": material_obj_id})
        if not material:
            print(f"Material not found: {material_id}")
            return jsonify({'error': 'Material not found'}), 400
    
        item_doc = {
            "unique_id": unique_id,
            "name": name,
            "category_id": category_obj_id,
            "material_id": material_obj_id,
            "price": float(price),
            "weight": float(weight) if weight else None,
            "stock": int(stock),
            "description": description,
            "image_url": image_url,
            "sold_count": 0,
            "created_at": datetime.datetime.now()
        }
        
        items_collection.insert_one(item_doc)
        socketio.emit("update_items", get_items().get_json())
        return jsonify({'message': 'Item added successfully'})
    except Exception as e:
        print(f"Error in add_item: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --------------------------
# Update Item (Require Login)
# --------------------------
@app.route('/update_item', methods=['PUT'])
def update_item():
    data = request.json
    item_id = data.get('id')
    
    if not item_id:
        return jsonify({'error': 'Item id is required'}), 400

    try:
        update_fields = {}
        
        if 'unique_id' in data:
            update_fields['unique_id'] = data['unique_id']
        if 'name' in data:
            update_fields['name'] = data['name']
        if 'category_id' in data:
            update_fields['category_id'] = ObjectId(data['category_id'])
        if 'material_id' in data:
            update_fields['material_id'] = ObjectId(data['material_id'])
        if 'price' in data:
            update_fields['price'] = float(data['price'])
        if 'weight' in data:
            update_fields['weight'] = float(data['weight']) if data['weight'] else None
        if 'stock' in data:
            update_fields['stock'] = int(data['stock'])
        if 'description' in data:
            update_fields['description'] = data['description']
        if 'image_url' in data:
            update_fields['image_url'] = data['image_url']
        
        result = items_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Item not found'}), 404
        
        socketio.emit("update_items", get_items().get_json())
        return jsonify({'message': 'Item updated successfully'})
    except InvalidId:
        return jsonify({'error': 'Invalid item_id, category_id, or material_id'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --------------------------
# Delete Item (Require Login & Admin Role)
# --------------------------
@app.route('/delete_item', methods=['DELETE'])
def delete_item():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized - admin only'}), 403

    item_id = request.args.get('id')
    if not item_id:
        return jsonify({'error': 'Item id is required'}), 400

    try:
        result = items_collection.delete_one({"_id": ObjectId(item_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Item not found'}), 404
        
        socketio.emit("update_items", get_items().get_json())
        return jsonify({'message': 'Item deleted successfully'})
    except InvalidId:
        return jsonify({'error': 'Invalid item_id'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --------------------------
# CART Endpoints
# --------------------------
@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    data = request.json
    item_id = data.get('item_id')
    quantity = data.get('quantity', 1)
    
    if not item_id:
        return jsonify({'error': 'Item id is required'}), 400

    try:
        # Convert item_id to ObjectId if it's a string
        if isinstance(item_id, str):
            item_id = ObjectId(item_id)
        
        item = db.items.find_one({"_id": item_id})
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        if item.get('stock', 0) < quantity:
            return jsonify({'error': 'Insufficient stock'}), 400

        item_id_str = str(item_id)
        if item_id_str in cart:
            cart[item_id_str]['quantity'] += quantity
        else:
            cart[item_id_str] = {
                'id': item_id_str,
                'name': item.get('name'),
                'price': float(item.get('price', 0)),
                'quantity': quantity
            }
        
        socketio.emit("update_cart", list(cart.values()))
        return jsonify({'message': 'Item added to cart'})
    except Exception as e:
        print(f"Error adding to cart: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/remove_from_cart', methods=['POST'])
def remove_from_cart():
    data = request.json
    item_id = data.get('item_id')
    if not item_id:
        return jsonify({'error': 'Item id is required'}), 400
    if item_id not in cart:
        return jsonify({'error': 'Item not in cart'}), 400
    
    del cart[item_id]
    socketio.emit("update_cart", list(cart.values()))
    return jsonify({'message': 'Item removed from cart'})

# --------------------------
# Place Order
# --------------------------
@app.route('/place_order', methods=['POST'])
def place_order():
    global cart
    data = request.json
    customer_name = data.get('customer_name')
    customer_contact = data.get('customer_contact')
    payment_method = data.get('payment_method')
    making_charges = data.get('making_charges', 0)
    
    if not cart:
        return jsonify({'error': 'Cart is empty'}), 400

    try:
        base_total = sum(item['price'] * item['quantity'] for item in cart.values())
        metal_prices = get_metal_prices()  # e.g., {"Gold": 5000, "Silver": 70}
        metal_cost_total = 0

        # Calculate metal costs and update stock
        for i_id, item in cart.items():
            item_obj_id = ObjectId(i_id)
            item_doc = db.items.find_one({"_id": item_obj_id})
            
            if item_doc:
                material_id = item_doc.get('material_id')
                weight = item_doc.get('weight')
                
                if material_id:
                    # Get material info
                    material_doc = db.material.find_one({"_id": ObjectId(material_id)})
                    if material_doc:
                        material_name = material_doc.get('name', '')
                        if material_name.lower() in ["gold", "silver"] and weight:
                            rate = metal_prices.get(material_name.capitalize(), 0)
                            metal_cost_total += rate * float(weight) * item['quantity']

        final_total = base_total + float(making_charges) + metal_cost_total

        # Handle customer
        existing_customer = db.customers.find_one({"contact": customer_contact})
        if existing_customer:
            customer_id = existing_customer['_id']
        else:
            customer_doc = {
                "name": customer_name,
                "contact": customer_contact,
                "created_at": datetime.datetime.now()
            }
            customer_result = db.customers.insert_one(customer_doc)
            customer_id = customer_result.inserted_id

        # Create order
        order_doc = {
            "customer_id": customer_id,
            "total_price": final_total,
            "payment_method": payment_method,
            "order_date": datetime.datetime.now(),
            "status": "pending"
        }
        order_result = db.orders.insert_one(order_doc)
        order_id = order_result.inserted_id

        # Create order items and update stock
        for i_id, item in cart.items():
            item_obj_id = ObjectId(i_id)
            
            # Insert order item
            order_item_doc = {
                "order_id": order_id,
                "item_id": item_obj_id,
                "quantity": item['quantity'],
                "price": item['price'],
                "created_at": datetime.datetime.now()
            }
            db.order_items.insert_one(order_item_doc)
            
            # Update item stock and sold count
            db.items.update_one(
                {"_id": item_obj_id},
                {
                    "$inc": {
                        "stock": -item['quantity'],
                        "sold_count": item['quantity']
                    }
                }
            )

        # Generate PDF bill
        bills_dir = os.path.join(os.getcwd(), 'bills')
        os.makedirs(bills_dir, exist_ok=True)
        pdf_path = os.path.join(bills_dir, f'order_{str(order_id)}.pdf')

        c = canvas.Canvas(pdf_path)
        c.drawString(100, 800, f'Bill for Order #{str(order_id)}')
        c.drawString(100, 780, f'Customer: {customer_name}')
        c.drawString(100, 760, f'Contact: {customer_contact}')
        c.drawString(100, 740, f'Base Total: ₹{base_total:.2f}')
        c.drawString(100, 720, f'Making Charges: ₹{float(making_charges):.2f}')
        c.drawString(100, 700, f'Metal Cost: ₹{metal_cost_total:.2f}')
        c.drawString(100, 680, f'Final Total: ₹{final_total:.2f}')
        let_y = 660
        for item in cart.values():
            c.drawString(100, let_y, f'{item["name"]} - {item["quantity"]} pcs - ₹{item["price"]}')
            let_y -= 20
        c.save()

        cart = {}
        socketio.emit("update_cart", [])
        socketio.emit("update_items", get_items().get_json())

        if os.path.exists(pdf_path):
            return send_file(pdf_path, as_attachment=True)
        else:
            return jsonify({'error': 'PDF generation failed'}), 500
            
    except Exception as e:
        print(f"Error placing order: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --------------------------
# Order History
# --------------------------
@app.route('/get_order_history', methods=['GET'])
def get_order_history():
    try:
        # Aggregate orders with customer info
        pipeline = [
            {
                "$lookup": {
                    "from": "customers",
                    "localField": "customer_id",
                    "foreignField": "_id",
                    "as": "customer"
                }
            },
            {
                "$unwind": "$customer"
            },
            {
                "$sort": {"order_date": -1}
            }
        ]
        
        orders = list(db.orders.aggregate(pipeline))
        order_list = []
        
        for order in orders:
            try:
                order_dict = {
                    "order_id": str(order['_id']),
                    "customer_id": str(order['customer_id']),
                    "total_price": float(str(order.get('total_price', 0))),  # Convert Decimal128 to float
                    "order_date": order.get('order_date', datetime.datetime.now()).strftime("%Y-%m-%d %H:%M:%S"),
                    "payment_method": order.get('payment_method', ''),
                    "customer_name": order['customer'].get('name', ''),
                    "customer_contact": order['customer'].get('contact', ''),
                    "customer_email": order['customer'].get('email', ''),
                    "customer_address": order['customer'].get('address', '')
                }
                order_list.append(order_dict)
            except Exception as e:
                print(f"Error processing order {order.get('_id')}: {str(e)}")
                continue
        
        return jsonify(order_list)
    except Exception as e:
        print(f"Error fetching order history: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --------------------------
# Download Old Bill
# --------------------------
@app.route('/download_bill', methods=['GET'])
def download_bill():
    order_id = request.args.get('order_id')
    if not order_id:
        return jsonify({'error': 'Missing order_id'}), 400

    bills_dir = os.path.join(os.getcwd(), 'bills')
    pdf_path = os.path.join(bills_dir, f'order_{order_id}.pdf')
    if os.path.exists(pdf_path):
        return send_file(pdf_path, as_attachment=True)
    else:
        return jsonify({'error': 'Bill not found'}), 404

# --------------------------
# User Management API Endpoints
# --------------------------

@app.route('/users', methods=['GET'])
def get_users():
    """Get all users"""
    try:
        users = []
        user_docs = db.users.find({}, {"password_hash": 0})  # Exclude password hash
        
        for user in user_docs:
            users.append({
                "id": str(user['_id']),
                "username": user.get('username', ''),
                "email": user.get('email', ''),
                "role": user.get('role', 'staff'),
                "lastLogin": user.get('last_login', 'Never')
            })
            
        return jsonify(users)
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/add_user', methods=['POST'])
def add_user():
    """Add a new user"""
    data = request.json
    
    # Validate required fields
    if not all(key in data for key in ['username', 'email', 'password', 'role']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    username = data['username']
    email = data['email']
    password = data['password']
    role = data['role']
    
    try:
        # Check if username or email already exists
        existing_user = db.users.find_one({
            "$or": [
                {"username": username},
                {"email": email}
            ]
        })
        
        if existing_user:
            return jsonify({'error': 'Username or email already exists'}), 400
        
        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert the new user
        user_doc = {
            "username": username,
            "email": email,
            "password_hash": hashed_password,
            "role": role,
            "created_at": datetime.datetime.now(),
            "last_login": None
        }
        
        result = db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        return jsonify({'message': 'User created successfully', 'id': user_id}), 201
    except Exception as e:
        print(f"Error creating user: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/delete_user/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user by ID"""
    try:
        user_obj_id = to_object_id(user_id)
        if not user_obj_id:
            return jsonify({'error': 'Invalid user ID format'}), 400
        
        # Check if user exists
        user = db.users.find_one({"_id": user_obj_id})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete the user
        db.users.delete_one({"_id": user_obj_id})
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting user: {e}")
        return jsonify({'error': str(e)}), 500

# --------------------------
# Test Security Route
# --------------------------
@app.route('/api/security/test', methods=['GET'])
def test_security():
    return jsonify({'message': 'Security API is working'})

# --------------------------
# Security Settings Endpoint
# --------------------------
def send_security_notification(user_email, notification_type, details):
    """Send security notification emails"""
    try:
        if notification_type == 'email_change':
            subject = "Your Email Address Has Been Updated"
            body = f"""
            Hello,

            Your email address has been updated in the Jewelry Management System.
            
            Old Email: {details['old_email']}
            New Email: {details['new_email']}
            
            If you did not make this change, please contact support immediately.
            
            Best regards,
            Jewelry Management System Team
            """
        elif notification_type == 'password_change':
            subject = "Your Password Has Been Updated"
            body = f"""
            Hello,

            Your password has been updated in the Jewelry Management System.
            
            If you did not make this change, please contact support immediately.
            
            Best regards,
            Jewelry Management System Team
            """
        else:
            return False

        msg = Message(
            subject=subject,
            sender=app.config['MAIL_USERNAME'],
            recipients=[user_email],
            body=body
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error sending email notification: {str(e)}")
        return False

@app.route('/api/security/update-account', methods=['OPTIONS'])
def handle_update_account_options():
    response = app.make_default_options_response()
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS') # Only allow POST and OPTIONS for this route
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

@app.route('/api/security/update-account', methods=['POST'])
def update_account():
    print("Security update route hit")  # Debug log
    try:
        data = request.json
        print("Request data:", data)  # Debug log
        
        current_password = data.get('currentPassword')
        new_username = data.get('newUsername')
        new_password = data.get('newPassword')
        new_email = data.get('newEmail')

        if not current_password:
            print("No current password provided")  # Debug log
            return jsonify({'error': 'Current password is required'}), 400

        user_obj_id = ObjectId(current_user.id)
        
        # Verify current password
        user = db.users.find_one({"_id": user_obj_id})
        if not user:
            print("User not found")  # Debug log
            return jsonify({'error': 'User not found'}), 404
            
        stored_hash = user.get('password_hash')
        current_email = user.get('email')
        
        if not bcrypt.checkpw(current_password.encode('utf-8'), stored_hash.encode('utf-8')):
            print("Invalid current password")  # Debug log
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        update_fields = {}
        
        # Update username if provided
        if new_username:
            print("Updating username")  # Debug log
            # Check if username already exists
            existing_user = db.users.find_one({
                "username": new_username,
                "_id": {"$ne": user_obj_id}
            })
            if existing_user:
                print("Username already exists")  # Debug log
                return jsonify({'error': 'Username already exists'}), 400
                
            update_fields["username"] = new_username

        # Update email if provided
        if new_email:
            print("Updating email")  # Debug log
            # Check if email already exists
            existing_user = db.users.find_one({
                "email": new_email,
                "_id": {"$ne": user_obj_id}
            })
            if existing_user:
                print("Email already exists")  # Debug log
                return jsonify({'error': 'Email already exists'}), 400
                
            update_fields["email"] = new_email
            
            # Send notification email about email change
            send_security_notification(
                new_email,
                'email_change',
                {
                    'old_email': current_email,
                    'new_email': new_email
                }
            )

        # Update password if provided
        if new_password:
            print("Updating password")  # Debug log
            hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            update_fields["password_hash"] = hashed_password
            
            # Send notification email about password change
            send_security_notification(
                current_email,
                'password_change',
                {}
            )

        # Perform the update
        if update_fields:
            db.users.update_one(
                {"_id": user_obj_id},
                {"$set": update_fields}
            )

        print("Update successful")  # Debug log
        return jsonify({'message': 'Account updated successfully'}), 200
        
    except Exception as e:
        print("Error in update_account:", str(e))  # Debug log
        return jsonify({'error': str(e)}), 500

# Data Management Routes
@app.route('/api/data/export', methods=['GET'])
@login_required
def export_data():
    try:
        # Get all data from the database
        data = {
            'items': [],
            'categories': [],
            'materials': [],
            'orders': [],
            'customers': [],
            'users': []
        }
        
        # Convert ObjectId to string for JSON serialization
        def convert_objectid(doc):
            if isinstance(doc, list):
                return [convert_objectid(item) for item in doc]
            elif isinstance(doc, dict):
                result = {}
                for key, value in doc.items():
                    if key == '_id':
                        result['id'] = str(value)
                    elif isinstance(value, ObjectId):
                        result[key] = str(value)
                    elif isinstance(value, (dict, list)):
                        result[key] = convert_objectid(value)
                    else:
                        result[key] = value
                return result
            else:
                return doc
        
        # Fetch items
        items = list(db.items.find({}))
        data['items'] = convert_objectid(items)
        
        # Fetch categories
        categories = list(db.category.find({}))
        data['categories'] = convert_objectid(categories)
        
        # Fetch materials
        materials = list(db.material.find({}))
        data['materials'] = convert_objectid(materials)
        
        # Fetch orders
        orders = list(db.orders.find({}))
        data['orders'] = convert_objectid(orders)
        
        # Fetch customers
        customers = list(db.customers.find({}))
        data['customers'] = convert_objectid(customers)
        
        # Fetch users (excluding password hashes)
        users = list(db.users.find({}, {"password_hash": 0}))
        data['users'] = convert_objectid(users)
        
        # Create response with file download using custom encoder
        response = make_response(json.dumps(data, indent=2, cls=CustomJSONEncoder))
        response.headers['Content-Disposition'] = 'attachment; filename=jewelry-management-data.json'
        response.headers['Content-Type'] = 'application/json'
        
        return response
    except Exception as e:
        print(f"Export error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/import', methods=['POST'])
@login_required
def import_data():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        if not file.filename.endswith('.json'):
            return jsonify({'error': 'Invalid file format. Please upload a JSON file'}), 400
            
        # Read and parse JSON data
        data = json.loads(file.read())
        
        # Convert string IDs back to ObjectIds where necessary
        def convert_ids(doc):
            if isinstance(doc, list):
                return [convert_ids(item) for item in doc]
            elif isinstance(doc, dict):
                result = {}
                for key, value in doc.items():
                    if key == 'id':
                        result['_id'] = ObjectId(value) if value else ObjectId()
                    elif key.endswith('_id') and value and isinstance(value, str):
                        try:
                            result[key] = ObjectId(value)
                        except:
                            result[key] = value
                    elif isinstance(value, (dict, list)):
                        result[key] = convert_ids(value)
                    else:
                        result[key] = value
                return result
            else:
                return doc
        
        # Import data into database collections
        collection_mapping = {
            'items': 'items',
            'categories': 'category',
            'materials': 'material',
            'orders': 'orders',
            'customers': 'customers',
            'users': 'users'
        }
        
        for data_key, collection_name in collection_mapping.items():
            if data_key in data and data[data_key]:
                # Clear existing data
                db[collection_name].delete_many({})
                
                # Convert and insert new data
                converted_data = convert_ids(data[data_key])
                if converted_data:
                    db[collection_name].insert_many(converted_data)
        
        return jsonify({'message': 'Data imported successfully'}), 200
    except Exception as e:
        print(f"Import error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/backup', methods=['POST'])
@login_required
def create_backup():
    try:
        # Create backup directory if it doesn't exist
        backup_dir = os.path.join(os.path.dirname(__file__), 'backups')
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
            
        # Generate backup filename with timestamp
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'backup_{timestamp}.json')
        
        # Get all data
        data = {
            'items': [],
            'categories': [],
            'materials': [],
            'orders': [],
            'customers': [],
            'users': []
        }
        
        # Convert ObjectId to string for JSON serialization
        def convert_objectid(doc):
            if isinstance(doc, list):
                return [convert_objectid(item) for item in doc]
            elif isinstance(doc, dict):
                result = {}
                for key, value in doc.items():
                    if key == '_id':
                        result['id'] = str(value)
                    elif isinstance(value, ObjectId):
                        result[key] = str(value)
                    elif isinstance(value, (dict, list)):
                        result[key] = convert_objectid(value)
                    else:
                        result[key] = value
                return result
            else:
                return doc
        
        # Fetch items
        items = list(db.items.find({}))
        data['items'] = convert_objectid(items)
        
        # Fetch categories
        categories = list(db.category.find({}))
        data['categories'] = convert_objectid(categories)
        
        # Fetch materials
        materials = list(db.material.find({}))
        data['materials'] = convert_objectid(materials)
        
        # Fetch orders
        orders = list(db.orders.find({}))
        data['orders'] = convert_objectid(orders)
        
        # Fetch customers
        customers = list(db.customers.find({}))
        data['customers'] = convert_objectid(customers)
        
        # Fetch users (excluding password hashes)
        users = list(db.users.find({}, {"password_hash": 0}))
        data['users'] = convert_objectid(users)
        
        # Save to file using custom encoder
        with open(backup_file, 'w') as f:
            json.dump(data, f, indent=2, cls=CustomJSONEncoder)
            
        return jsonify({
            'message': 'Backup created successfully',
            'backup_file': backup_file
        }), 200
    except Exception as e:
        print(f"Backup error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/integrations/settings', methods=['GET', 'POST'])
@login_required
def handle_integration_settings():
    if request.method == 'GET':
        try:
            from bson import ObjectId
            user_obj_id = ObjectId(current_user.id)
            settings = db.integration_settings.find_one({"user_id": user_obj_id})
            
            if settings:
                return jsonify({
                    'shopify': json.loads(settings.get('shopify_config', '{}')),
                    'quickbooks': json.loads(settings.get('quickbooks_config', '{}')),
                    'stripe': json.loads(settings.get('stripe_config', '{}')),
                    'mailchimp': json.loads(settings.get('mailchimp_config', '{}'))
                })
            return jsonify({}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            # Validate required fields for each enabled integration
            for integration, config in data.items():
                if config.get('enabled'):
                    if integration == 'shopify':
                        if not all([config.get('shopName'), config.get('apiKey'), config.get('apiSecret')]):
                            return jsonify({'error': 'Missing required Shopify credentials'}), 400
                    elif integration == 'quickbooks':
                        if not all([config.get('clientId'), config.get('clientSecret'), config.get('companyId')]):
                            return jsonify({'error': 'Missing required QuickBooks credentials'}), 400
                    elif integration == 'stripe':
                        if not all([config.get('publishableKey'), config.get('secretKey')]):
                            return jsonify({'error': 'Missing required Stripe credentials'}), 400
                    elif integration == 'mailchimp':
                        if not all([config.get('apiKey'), config.get('listId')]):
                            return jsonify({'error': 'Missing required Mailchimp credentials'}), 400

            from bson import ObjectId
            user_obj_id = ObjectId(current_user.id)
            
            settings_doc = {
                "user_id": user_obj_id,
                "shopify_config": json.dumps(data.get('shopify', {})),
                "quickbooks_config": json.dumps(data.get('quickbooks', {})),
                "stripe_config": json.dumps(data.get('stripe', {})),
                "mailchimp_config": json.dumps(data.get('mailchimp', {})),
                "updated_at": datetime.datetime.now()
            }
            
            db.integration_settings.update_one(
                {"user_id": user_obj_id},
                {"$set": settings_doc},
                upsert=True
            )
            
            return jsonify({'message': 'Integration settings saved successfully'}), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/notifications/settings', methods=['GET', 'POST'])
@login_required
def handle_notification_settings():
    if request.method == 'GET':
        try:
            # Get user's notification settings from Supabase
            response = supabase.table('notification_settings').select('*').eq('user_id', current_user.id).execute()
            
            if response.data and len(response.data) > 0:
                return jsonify(response.data[0].get('settings', {}))
            
            # Return default settings if none exist
            return jsonify({
                'email': {
                    'enabled': True,
                    'lowStock': True,
                    'orderUpdates': True,
                    'priceUpdates': True,
                    'securityAlerts': True
                },
                'push': {
                    'enabled': True,
                    'lowStock': True,
                    'orderUpdates': True,
                    'priceUpdates': True,
                    'securityAlerts': True
                }
            })
        except Exception as e:
            print(f"Error fetching notification settings: {str(e)}")
            return jsonify({'error': str(e)}), 500

    elif request.method == 'POST':
        try:
            data = request.get_json()
            print("Received settings data:", data)  # Debug log
            
            # Validate the notification settings structure
            required_channels = ['email', 'push']
            required_settings = ['enabled', 'lowStock', 'orderUpdates', 'priceUpdates', 'securityAlerts']
            
            for channel in required_channels:
                if channel not in data:
                    return jsonify({'error': f'Missing {channel} settings'}), 400
                for setting in required_settings:
                    if setting not in data[channel]:
                        return jsonify({'error': f'Missing {setting} setting for {channel}'}), 400
            
            # Use upsert to insert or update the notification settings, specifying the conflict column
            response = supabase.table('notification_settings').upsert({
                "user_id": current_user.id,
                "settings": data,
                "updated_at": datetime.datetime.now().isoformat()
            }, on_conflict='user_id').execute()
            
            print(f"Upsert response:", response)  # Debug log
            
            # Check for errors in the upsert response
            if response.data is None and response.error:
                 print(f"Supabase Upsert Error: {response.error}")
                 return jsonify({'error': response.error.message}), 500

            return jsonify({'message': 'Notification settings saved successfully'}), 200
            
        except Exception as e:
            print(f"Error saving notification settings: {str(e)}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/settings/general', methods=['POST'])
@login_required
def save_general_settings():
    data = request.json
    try:
        # Update or insert user settings
        db.user_settings.update_one(
            {'user_id': current_user.id},
            {
                '$set': {
                    'user_id': current_user.id,
                    'language': data['language'],
                    'currency': data['currency'],
                    'timezone': data['timezone'],
                    'date_format': data['dateFormat'],
                    'updated_at': datetime.datetime.utcnow()
                }
            },
            upsert=True
        )
        return jsonify({'message': 'Settings saved successfully'})
    except Exception as e:
        print(f"Error saving general settings: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/shop/settings', methods=['GET', 'POST'])
@login_required
def handle_shop_settings():
    if request.method == 'GET':
        try:
            result = db.shop_info.find_one({'_id': 1})
            if result:
                return jsonify({
                    'name': result.get('name', ''),
                    'email': result.get('email', ''),
                    'contact': result.get('contact', ''),
                    'address': result.get('address', '')
                })
            return jsonify({}), 404
        except Exception as e:
            print(f"Error fetching shop settings: {str(e)}")
            return jsonify({'error': str(e)}), 500
    elif request.method == 'POST':
        try:
            data = request.json
            # Update or insert shop info
            db.shop_info.update_one(
                {'_id': 1},
                {
                    '$set': {
                        '_id': 1,
                        'name': data['name'],
                        'email': data['email'],
                        'contact': data['contact'],
                        'address': data['address'],
                        'updated_at': datetime.datetime.utcnow()
                    }
                },
                upsert=True
            )
            return jsonify({'message': 'Shop settings saved successfully'}), 200
        except Exception as e:
            print(f"Error saving shop settings: {str(e)}")
            return jsonify({'error': str(e)}), 500

@app.route('/api/shop/upload-logo', methods=['POST'])
@login_required
def upload_shop_logo():
    if 'logo' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['logo']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    if file:
        try:
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            
            # Update shop info with logo URL
            db.shop_info.update_one(
                {'_id': 1},
                {
                    '$set': {
                        'logo_url': f'/product_img/{filename}',
                        'updated_at': datetime.datetime.utcnow()
                    }
                },
                upsert=True
            )
            
            return jsonify({'logo_url': f'/product_img/{filename}'})
        except Exception as e:
            print(f"Error uploading logo: {str(e)}")
            return jsonify({'error': str(e)}), 500

# Additional helper functions for MongoDB operations

def get_next_sequence_id(collection_name):
    """Get next auto-increment ID for a collection"""
    try:
        result = db.counters.find_one_and_update(
            {'_id': collection_name},
            {'$inc': {'seq': 1}},
            upsert=True,
            return_document=True
        )
        return result['seq']
    except Exception as e:
        print(f"Error getting sequence ID: {str(e)}")
        return 1

def initialize_counters():
    """Initialize counters for auto-increment IDs"""
    collections = ['users', 'items', 'category', 'material', 'customers', 'orders', 'order_items']
    for collection in collections:
        # Check if counter exists
        counter = db.counters.find_one({'_id': collection})
        if not counter:
            # Find the maximum existing ID in the collection
            max_doc = db[collection].find_one(sort=[('_id', -1)])
            max_id = max_doc['_id'] if max_doc and '_id' in max_doc and isinstance(max_doc['_id'], int) else 0
            
            # Initialize counter
            db.counters.insert_one({
                '_id': collection,
                'seq': max_id
            })

# Initialize counters when the app starts
with app.app_context():
    initialize_counters()

def convert_objectid_to_dict(doc):
    """Convert MongoDB ObjectId to string in document"""
    if doc and '_id' in doc and hasattr(doc['_id'], '__str__'):
        if not isinstance(doc['_id'], (int, str)):
            doc['_id'] = str(doc['_id'])
    return doc

def convert_cursor_to_list(cursor):
    """Convert MongoDB cursor to list with ObjectId handling"""
    result = []
    for doc in cursor:
        result.append(convert_objectid_to_dict(doc))
    return result

# Additional utility functions for data type conversion
def prepare_item_for_db(item_data):
    """Prepare item data for MongoDB insertion"""
    if 'price' in item_data:
        item_data['price'] = float(item_data['price']) if item_data['price'] is not None else 0.0
    if 'weight' in item_data:
        item_data['weight'] = float(item_data['weight']) if item_data['weight'] is not None else 0.0
    if 'stock' in item_data:
        item_data['stock'] = int(item_data['stock']) if item_data['stock'] is not None else 0
    if 'sold_count' in item_data:
        item_data['sold_count'] = int(item_data['sold_count']) if item_data['sold_count'] is not None else 0
    if 'category_id' in item_data:
        item_data['category_id'] = int(item_data['category_id']) if item_data['category_id'] is not None else None
    if 'material_id' in item_data:
        item_data['material_id'] = int(item_data['material_id']) if item_data['material_id'] is not None else None
    
    return item_data

def prepare_order_for_db(order_data):
    """Prepare order data for MongoDB insertion"""
    if 'total_price' in order_data:
        order_data['total_price'] = float(order_data['total_price']) if order_data['total_price'] is not None else 0.0
    if 'customer_id' in order_data:
        order_data['customer_id'] = int(order_data['customer_id']) if order_data['customer_id'] is not None else None
    
    return order_data

# Error handling wrapper for MongoDB operations
def handle_mongo_operation(operation_func):
    """Wrapper for MongoDB operations with error handling"""
    def wrapper(*args, **kwargs):
        try:
            return operation_func(*args, **kwargs)
        except Exception as e:
            print(f"MongoDB operation error: {str(e)}")
            raise e
    return wrapper

# Additional routes for debugging and monitoring
@app.route('/api/debug/collections', methods=['GET'])
@login_required
def debug_collections():
    """Debug route to list all collections and their document counts"""
    try:
        collections_info = {}
        collection_names = db.list_collection_names()
        
        for name in collection_names:
            count = db[name].count_documents({})
            collections_info[name] = count
        
        return jsonify({
            'collections': collections_info,
            'total_collections': len(collection_names)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug/connection', methods=['GET'])
def debug_connection():
    """Debug route to check MongoDB connection"""
    try:
        # Ping the database
        client.admin.command('ping')
        return jsonify({
            'status': 'connected',
            'database': DATABASE_NAME,
            'message': 'MongoDB connection is working'
        })
    except Exception as e:
        return jsonify({
            'status': 'disconnected',
            'error': str(e)
        }), 500

# Health check route
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check MongoDB connection
        client.admin.command('ping')
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.datetime.utcnow().isoformat()
        }), 500

# Cleanup function for graceful shutdown
def cleanup_connections():
    """Clean up database connections"""
    try:
        if 'client' in globals():
            client.close()
            print("MongoDB connection closed")
    except Exception as e:
        print(f"Error closing MongoDB connection: {str(e)}")

# Register cleanup function
import atexit
atexit.register(cleanup_connections)

@app.before_request
def log_request_info():
    print(f"Incoming Request: Method={request.method}, Path={request.path}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, debug=False, host='0.0.0.0', port=port)