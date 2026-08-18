from flask import Flask, request, jsonify, send_file, send_from_directory, make_response, session
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
import bcrypt
from supabase import create_client, Client
from dotenv import load_dotenv
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from functools import wraps
from flask_cors import cross_origin

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Configure CORS properly
CORS(app, 
     supports_credentials=True,
     resources={
         r"/*": {
             "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "max_age": 3600,
             "send_wildcard": False
         }
     },
     automatic_options=True)

# Add session configuration
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = datetime.timedelta(days=7)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_NAME'] = 'jewelry_session'
app.config['SESSION_COOKIE_DOMAIN'] = None  # Let Flask handle the domain
app.config['SESSION_COOKIE_PATH'] = '/'  # Ensure cookie is available for all paths
app.config['SESSION_REFRESH_EACH_REQUEST'] = True  # Refresh session on each request

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.session_protection = 'strong'

# Custom error handler for unauthorized access
@login_manager.unauthorized_handler
def unauthorized():
    print("[unauthorized] Unauthorized handler triggered.") # Debug log
    response = jsonify({
        'error': 'Unauthorized',
        'message': 'Please log in to access this resource'
    })
    response.status_code = 401
    return response

# Custom decorator to handle authentication errors
def handle_auth_error(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'error': 'Authentication Error',
                'message': str(e)
            }), 401
    return decorated_function

socketio = SocketIO(app, cors_allowed_origins="*")

# Supabase Configuration
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY") # This is the anon key
)

supabase_service_client: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY") # Use the service_role key for backend operations
)



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

# Custom JSON encoder to handle Decimal and datetime types
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        return super(CustomJSONEncoder, self).default(obj)

# --------------------------
# Flask-Login User class
# --------------------------
class User:
    def __init__(self, user_id, username, role):
        self.id = user_id
        self.username = username
        self.role = role

    def get_id(self):
        return str(self.id)

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

@login_manager.user_loader
def load_user(user_id):
    try:
        print(f"[load_user] Attempting to load user with ID: {user_id}")  # Debug log
        if user_id is None:
            print("[load_user] Received None user_id.")
            return None
            
        # Ensure user_id is convertible to an integer
        try:
            user_id_int = int(user_id)
            print(f"[load_user] Converted user_id to int: {user_id_int}")
        except ValueError:
            print(f"[load_user] Error: user_id '{user_id}' is not a valid integer.")
            return None

        # Use service client to bypass RLS for user loading
        print(f"[load_user] Querying Supabase 'users' table for ID {user_id_int}...")
        response = None # Initialize response to None
        try:
            response = supabase_service_client.table('users').select('*').eq('id', user_id_int).execute()
            print(f"[load_user] Supabase query executed successfully.")

            # Check the response data
            if response and response.data:
                user = response.data[0]
                print(f"[load_user] Successfully loaded user: {user['username']} (ID: {user['id']})")  # Debug log
                return User(user['id'], user['username'], user['role'])
            else:
                print(f"[load_user] No user found in DB with ID: {user_id_int} or empty data returned.")  # Debug log
                # Log the response structure if data is missing
                print(f"[load_user] Supabase response object type (no data): {type(response)}")
                if response:
                    print(f"[load_user] Supabase response attributes (no data): {dir(response)}")
                    # Attempt to print more details about the response if possible
                    try:
                        print(f"[load_user] Supabase response content (no data): {response}")
                    except Exception as print_err:
                        print(f"[load_user] Error printing response content (no data): {print_err}")

        except Exception as query_err:
            print(f"[load_user] Error executing Supabase query for ID {user_id_int}: {query_err}")
            # Log the response object even if an error occurred during execution
            print(f"[load_user] Supabase response object type (query error): {type(response)}")
            if response:
                print(f"[load_user] Supabase response attributes (query error): {dir(response)}")
                try:
                    print(f"[load_user] Supabase response content (query error): {response}")
                except Exception as print_err:
                    print(f"[load_user] Error printing response content (query error): {print_err}")

    except Exception as e:
        print(f"[load_user] An unexpected error occurred in load_user for ID {user_id}: {e}")  # Debug log

    print(f"[load_user] Returning None for ID: {user_id} after checks.") # Debug log
    return None

# --------------------------
# Database Initialization
# --------------------------
def initialize_database():
    """Create necessary database tables if they don't exist"""
    try:
        # Use service client to check and create admin user
        response = supabase_service_client.table('users').select('id').eq('role', 'admin').execute()
        
        if len(response.data) == 0:
            # Create default admin user (username: admin, password: admin123)
            # Generate a fresh hash for admin123
            password = 'admin123'
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            
            supabase_service_client.table('users').insert({
                'username': 'admin',
                'email': 'admin@example.com',
                'password_hash': hashed_password,
                'role': 'admin'
            }).execute()
        else:
            # Update existing admin user's password
            password = 'admin123'
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            
            supabase_service_client.table('users').update({
                'password_hash': hashed_password
            }).eq('role', 'admin').execute()
        
        print("Database initialization completed successfully")
    except Exception as e:
        print(f"Error initializing database with service client: {e}")

@app.before_request
def log_request_user():
    # Explicitly check incoming cookies
    print(f"[{datetime.datetime.now()}] Incoming Cookies: {request.cookies}")
    # Keep the original request information available for other logging
    # print(f"[{datetime.datetime.now()}] Request to {request.path}, Method: {request.method}")
    # is_authenticated = current_user.is_authenticated if current_user else 'N/A'
    # user_info = current_user.get_id() if current_user and current_user.is_authenticated else 'Anonymous/None'
    # print(f"[{datetime.datetime.now()}] Flask-Login: Authenticated: {is_authenticated}, User ID: {user_info}")
    # session_user_id = session.get('_user_id')
    # print(f"[{datetime.datetime.now()}] Flask Session: session['_user_id']: {session_user_id}")

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

        # Save to DB using service client
        supabase_service_client.table('shop_info').insert({
            'name': name,
            'contact': contact,
            'email': email,
            'address': address
        }).execute()
        return jsonify({"message": "Saved"}), 200

    return jsonify({"error": "Missing data"}), 400

# --------------------------
# Login Endpoint
# --------------------------
@app.route('/login', methods=['POST'])
def login():
    print("Login attempt received")  # Debug log
    data = request.json
    print(f"Received data: {data}")  # Debug log

    username = data.get('username')
    password = data.get('password')

    print(f"Login attempt for username: {username}")  # Debug log

    if not username or not password:
        print("Missing username or password")  # Debug log
        return jsonify({"error": "Username and password required"}), 400

    try:
        # Use service client to fetch user data for authentication
        response = supabase_service_client.table('users').select('*').eq('username', username).execute()
        print(f"Query response from service client: {response}")  # Debug log

        if not response.data:
            print(f"No user found with username: {username}")  # Debug log
            return jsonify({"error": "Invalid username or password"}), 401

        user = response.data[0]
        print(f"Found user: {user}")  # Debug log

        # Get the stored hash from the database
        stored_hash = user['password_hash']
        
        # Convert input password to bytes
        input_password = password.encode('utf-8')
        
        # Convert stored hash to bytes if it's a string
        if isinstance(stored_hash, str):
            stored_hash = stored_hash.encode('utf-8')

        # Verify the password
        password_verified = bcrypt.checkpw(input_password, stored_hash)
        print(f"Password verification result: {password_verified}")  # Debug log

        if password_verified:
            print(f"Password verified for user: {username}")  # Debug log
            user_obj = User(user['id'], user['username'], user['role'])
            login_user(user_obj, remember=True)  # Enable remember me
            
            # Update last login time
            supabase_service_client.table('users').update({
                'last_login': datetime.datetime.now().isoformat()
            }).eq('id', user['id']).execute()
            
            # Return success response with session info
            response = jsonify({
                "message": "Login successful",
                "role": user['role'],
                "user": {
                    "id": user['id'],
                    "username": user['username'],
                    "role": user['role']
                }
            })
            
            # Set session cookie
            response.set_cookie(
                'jewelry_session',
                request.cookies.get('session', ''),
                httponly=True,
                samesite='Lax',
                max_age=7*24*60*60  # 7 days
            )
            
            print(f"Session cookie set: {request.cookies.get('session', '')}")  # Debug log
            return response
        else:
            print(f"Invalid password for user: {username}")  # Debug log
            return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        print(f"Error during login: {str(e)}")  # Debug log
        return jsonify({"error": "An error occurred during login"}), 500

# --------------------------
# Logout Endpoint
# --------------------------
@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    response = jsonify({"message": "Logged out successfully"})
    return response

# --------------------------
# Serve Uploaded Images
# --------------------------
@app.route('/product_img/<filename>')
def serve_image(filename):
    # Use the regular client here as this might be public or handled by RLS policies
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
    # You might want to save image path to DB here, using service client if necessary
    return jsonify({'message': 'Image uploaded', 'path': file_path})

@app.route('/autocomplete', methods=['GET'])
def autocomplete():
    # Use the regular client here, assuming item searching is allowed by RLS
    q = request.args.get('q', '')
    response = supabase.table('items').select('id, name').ilike('name', f'%{q}%').limit(10).execute()
    return jsonify([{"id": item['id'], "name": item['name']} for item in response.data])

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

        usd_to_inr = 82.0  # approximate conversion rate
        gold_oz_usd = data["rates"]["USDXAU"]
        silver_oz_usd = data["rates"]["USDXAG"]

        gold_oz_inr = gold_oz_usd * usd_to_inr
        silver_oz_inr = silver_oz_usd * usd_to_inr

        # 1 troy ounce = 31.1035 grams
        gold_g_inr = gold_oz_inr / 31.1035
        silver_g_inr = silver_oz_inr / 31.1035

        return {
            "Gold": round(gold_g_inr, 2),
            "Silver": round(silver_g_inr, 2)
        }
    except Exception as e:
        print("MetalPriceAPI exception:", e)
        return {"Gold": 5000, "Silver": 70}

# --------------------------
# Advanced Category Management Endpoints
# --------------------------
def get_category_tree():
    try:
        print("Fetching category tree...")  # Debug log
        # Use regular client here, assuming category viewing is allowed by RLS
        response = supabase.table('category').select('*').order('sort_order').execute()
        print(f"Raw Supabase response: {response}")  # Debug log
        categories = response.data
        print(f"Categories data: {categories}")  # Debug log

        # Build a dictionary mapping id to category object
        cat_dict = {cat["id"]: {**cat, "subcategories": []} for cat in categories}
        tree = []
        for cat in categories:
            if cat["parent_id"]:
                parent = cat_dict.get(cat["parent_id"])
                if parent:
                    parent["subcategories"].append(cat_dict[cat["id"]])
            else:
                tree.append(cat_dict[cat["id"]])
        print(f"Built category tree: {tree}")  # Debug log
        return tree
    except Exception as e:
        print(f"Error building category tree: {e}")  # Debug log
        return []

@app.route('/get_category_tree', methods=['GET'])
def fetch_category_tree():
    try:
        tree = get_category_tree()
        print(f"Returning category tree: {tree}")  # Debug log
        return jsonify(tree)
    except Exception as e:
        print(f"Error fetching category tree: {e}")  # Debug log
        return jsonify([])

@app.route('/category', methods=['POST'])
def add_category():
    try:
        data = request.json
        print(f"Adding category with data: {data}")  # Debug log
        name = data.get("name")
        parent_id = data.get("parent_id")
        sort_order = data.get("sort_order", 0)
        visibility = data.get("visibility", True)

        if not name:
            return jsonify({"error": "Category name is required"}), 400

        # Use service client for inserting categories
        response = supabase_service_client.table('category').insert({
            'name': name,
            'parent_id': parent_id,
            'sort_order': sort_order,
            'visibility': visibility
        }).execute()
        print(f"Category insert response: {response}")  # Debug log

        # Fetch updated tree immediately after insert
        tree = get_category_tree()
        print(f"Updated tree after insert: {tree}")  # Debug log

        # Emit the updated category tree
        socketio.emit("update_categories", tree)
        return jsonify({
            "message": "Category added successfully",
            "category": response.data[0],
            "tree": tree  # Send the updated tree in response
        })
    except Exception as e:
        print(f"Error adding category: {e}")  # Debug log
        return jsonify({"error": str(e)}), 500

@app.route('/category/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    try:
        data = request.json
        print(f"Updating category {category_id} with data: {data}")  # Debug log
        update_data = {}

        if "name" in data:
            update_data["name"] = data["name"]
        if "parent_id" in data:
            update_data["parent_id"] = data["parent_id"]
        if "sort_order" in data:
            update_data["sort_order"] = data["sort_order"]
        if "visibility" in data:
            update_data["visibility"] = data["visibility"]

        if not update_data:
            return jsonify({"error": "No valid fields to update"}), 400

        # Use service client for updating categories
        response = supabase_service_client.table('category').update(update_data).eq('id', category_id).execute()
        print(f"Category update response: {response}")  # Debug log

        # Fetch updated tree immediately after update
        tree = get_category_tree()
        print(f"Updated tree after update: {tree}")  # Debug log

        # Emit the updated category tree
        socketio.emit("update_categories", tree)
        return jsonify({
            "message": "Category updated successfully",
            "category": response.data[0],
            "tree": tree  # Send the updated tree in response
        })
    except Exception as e:
        print(f"Error updating category: {e}")  # Debug log
        return jsonify({"error": str(e)}), 500

@app.route('/category/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    try:
        print(f"Deleting category {category_id}")  # Debug log
        # Use service client for deleting categories
        response = supabase_service_client.table('category').delete().eq('id', category_id).execute()
        print(f"Category delete response: {response}")  # Debug log

        # Fetch updated tree immediately after delete
        tree = get_category_tree()
        print(f"Updated tree after delete: {tree}")  # Debug log

        # Emit the updated category tree
        socketio.emit("update_categories", tree)
        return jsonify({
            "message": "Category deleted successfully",
            "tree": tree  # Send the updated tree in response
        })
    except Exception as e:
        print(f"Error deleting category: {e}")  # Debug log
        return jsonify({"error": str(e)}), 500

# --------------------------
# Get Materials Endpoint
# --------------------------
@app.route('/get_materials', methods=['GET'])
def get_materials():
    # Use the regular client here, assuming material viewing is allowed by RLS
    print("Fetching materials...") # Debug log
    response = supabase.table('material').select('id, name').execute()
    print(f"Materials response: {response}") # Debug log
    return jsonify([{"id": m['id'], "name": m['name']} for m in response.data])

# Helper: Recursively get full category path (parent → child)
def get_category_path(category_id):
    path = []
    current_id = category_id

    while current_id:
        # Use regular client here, assuming category viewing is allowed by RLS
        response = supabase.table('category').select('name, parent_id').eq('id', current_id).execute()
        if not response.data:
            break
        category = response.data[0]
        path.insert(0, category['name'])
        current_id = category['parent_id']

    return path

@app.route('/get_item/<int:item_id>', methods=['GET'])
def get_item_details(item_id):
    try:
        print(f"Fetching item details for ID: {item_id}") # Debug log
        # Use regular client here, assuming item viewing is allowed by RLS
        response = supabase.table('items').select('*, category:category(name, parent_id)').eq('id', item_id).execute()
        print(f"Item details response: {response}") # Debug log
        
        if not response.data:
            print(f"Item with ID {item_id} not found") # Debug log
            return jsonify({'error': 'Item not found'}), 404

        item = response.data[0]
        print(f"Found item: {item}") # Debug log
        item['full_category_path'] = get_category_path(item.get('category_id'))
        print(f"Item with category path: {item}") # Debug log
        return jsonify(item)

    except Exception as e:
        print(f"Error in get_item_details for ID {item_id}: {e}") # Debug log
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/get_items_by_category', methods=['GET'])
def get_items_by_category():
    category_id = request.args.get('category_id')
    print(f"Fetching items for category ID: {category_id}") # Debug log

    if not category_id:
        print("Category ID is missing") # Debug log
        return jsonify({'error': 'category_id is required'}), 400

    try:
        # Get all categories for hierarchy traversal (use regular client)
        print("Fetching all categories for hierarchy traversal...") # Debug log
        response = supabase.table('category').select('id, parent_id').execute()
        print(f"All categories response for hierarchy: {response}") # Debug log
        all_cats = response.data

        # Map parent categories to their children
        from collections import defaultdict, deque
        child_map = defaultdict(list)
        
        for cat in all_cats:
            if cat['parent_id']:
                child_map[cat['parent_id']].append(cat['id'])

        # BFS to collect all categories (selected category + all descendants)
        print(f"Starting BFS from category ID: {category_id}") # Debug log
        all_category_ids = set([int(category_id)])
        to_visit = deque([int(category_id)])
        
        while to_visit:
            current_cat_id = to_visit.popleft()
            children = child_map.get(current_cat_id, [])
            print(f"Visiting category {current_cat_id}, children: {children}") # Debug log
            
            for child_id in children:
                if child_id not in all_category_ids:
                    all_category_ids.add(child_id)
                    to_visit.append(child_id)
        
        print(f"Identified all relevant category IDs: {list(all_category_ids)}") # Debug log

        # Fetch items from these category_ids (use regular client)
        print(f"Fetching items with category IDs: {list(all_category_ids)}") # Debug log
        response = supabase.table('items').select('*').in_('category_id', list(all_category_ids)).execute()
        print(f"Items by category response: {response}") # Debug log
        
        return jsonify(response.data)

    except Exception as e:
        print(f"Error in get_items_by_category: {str(e)}") # Debug log
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# --------------------------
# Get Items (with Sorting)
# --------------------------
@app.route('/get_items', methods=['GET'])
def get_items():
    sort = request.args.get('sort', '')
    print(f"Fetching all items with sort: {sort}") # Debug log
    
    # Use regular client here, assuming item viewing is allowed by RLS
    query = supabase.table('items').select('*')
    
    if sort == "price_asc":
        query = query.order('price')
    elif sort == "price_desc":
        query = query.order('price', desc=True)
    elif sort == "most_sold":
        query = query.order('sold_count', desc=True)
    elif sort == "new":
        query = query.order('created_at', desc=True)
    
    response = query.execute()
    print(f"All items response: {response}") # Debug log
    return jsonify(response.data)

# --------------------------
# Search Items Endpoint
# --------------------------
@app.route('/search', methods=['GET'])
def search_items():
    # Use regular client here, assuming item searching is allowed by RLS
    q = request.args.get('q', '')
    print(f"Searching items with query: {q}") # Debug log
    response = supabase.table('items').select('*').or_(f'name.ilike.%{q}%,unique_id.ilike.%{q}%').execute()
    print(f"Search items response: {response}") # Debug log
    return jsonify(response.data)

# --------------------------
# Add Item
# --------------------------
@app.route('/add_item', methods=['POST'])
def add_item():
    data = request.json
    print(f"Adding item with data: {data}") # Debug log
    unique_id = data.get('unique_id')
    name = data.get('name')
    category_id = data.get('category_id')
    material_id = data.get('material_id')
    price_data = data.get('price')
    weight_data = data.get('weight')
    stock_str = data.get('stock')
    description = data.get('description')
    image_url = data.get('image_url')

    # Handle price: if data is null or empty string, set to 0.0 (as price is NOT NULL in DB)
    price = float(price_data) if price_data is not None and price_data != '' else 0.0
    # Handle weight: if data is null or empty string, set to None (assuming weight is nullable)
    weight = float(weight_data) if weight_data is not None and weight_data != '' else None

    # Convert stock from potential empty string to integer (assuming 0 if empty)
    stock = int(stock_str) if stock_str is not None and stock_str != '' else 0 # Or handle as error if stock is strictly required

    if not (unique_id and name and category_id and material_id and stock is not None): # Ensure stock is checked if strictly required to be non-zero
        print("Missing required fields for adding item") # Debug log
        # Adjusted check: price and weight are now optional (None)
        return jsonify({'error': 'Missing required fields (unique_id, name, category_id, material_id, stock)'}), 400
    
    try:
        # Validate category_id exists (use regular client if RLS allows read)
        print(f"Validating category ID: {category_id}") # Debug log
        category_response = supabase.table('category').select('id').eq('id', category_id).execute()
        print(f"Category validation response: {category_response}") # Debug log
        if not category_response.data:
            print(f"Invalid category_id: {category_id}") # Debug log
            return jsonify({'error': 'Invalid category_id'}), 400
        
        # Validate material_id exists (use regular client if RLS allows read)
        print(f"Validating material ID: {material_id}") # Debug log
        material_response = supabase.table('material').select('id').eq('id', material_id).execute()
        print(f"Material validation response: {material_response}") # Debug log
        if not material_response.data:
            print(f"Invalid material_id: {material_id}") # Debug log
            return jsonify({'error': 'Invalid material_id'}), 400
        
        # Use service client for inserting items
        print("Inserting item with service client...") # Debug log
        response = supabase_service_client.table('items').insert({
            'unique_id': unique_id,
            'name': name,
            'category_id': category_id,
            'material_id': material_id,
            'price': price,  # Use the converted price (float or 0.0)
            'weight': weight,  # Use the converted weight (float or None)
            'stock': stock,  # Use the converted stock (int)
            'description': description,
            'image_url': image_url
        }).execute()
        print(f"Item insert response: {response}") # Debug log
        
        # Consider using service client for emitting updates if necessary
        # socketio.emit("update_items", get_items().get_json())
        return jsonify({'message': 'Item added successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --------------------------
# Update Item
# --------------------------
@app.route('/update_item', methods=['PUT'])
def update_item():
    data = request.json
    item_id = data.get('id')
    
    if not item_id:
        return jsonify({'error': 'Item id is required'}), 400

    try:
        # Use service client for updating items
        response = supabase_service_client.table('items').update({
            'unique_id': data.get('unique_id'),
            'name': data.get('name'),
            'category_id': data.get('category_id'),
            'material_id': data.get('material_id'),
            'price': data.get('price'),
            'weight': data.get('weight'),
            'stock': data.get('stock'),
            'description': data.get('description'),
            'image_url': data.get('image_url')
        }).eq('id', item_id).execute()
        
        # Consider using service client for emitting updates if necessary
        # socketio.emit("update_items", get_items().get_json())
        return jsonify({'message': 'Item updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --------------------------
# Delete Item
# --------------------------
@app.route('/delete_item', methods=['DELETE'])
def delete_item():
    item_id = request.args.get('id')
    if not item_id:
        return jsonify({'error': 'Item id is required'}), 400

    try:
        # Use service client for deleting items
        supabase_service_client.table('items').delete().eq('id', item_id).execute()
        # Consider using service client for emitting updates if necessary
        # socketio.emit("update_items", get_items().get_json())
        return jsonify({'message': 'Item deleted successfully'})
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
        # Use regular client here, assuming item viewing is allowed by RLS
        response = supabase.table('items').select('name, price, stock').eq('id', item_id).execute()
        item = response.data[0]
        
        if item['stock'] < quantity:
            return jsonify({'error': 'Insufficient stock'}), 400

        if item_id in cart:
            cart[item_id]['quantity'] += quantity
        else:
            cart[item_id] = {
                'id': item_id,
                'name': item['name'],
                'price': float(item['price']),
                'quantity': quantity
            }
        
        socketio.emit("update_cart", list(cart.values()))
        return jsonify({'message': 'Item added to cart'})
    except Exception as e:
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

# Handle quantity change
@app.route('/update_cart_item', methods=['OPTIONS', 'POST'])
@cross_origin(supports_credentials=True)
def update_cart_item():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.json
    item_id = data.get('item_id')
    quantity = data.get('quantity')

    if not item_id or quantity is None:
        return jsonify({'error': 'Item id and quantity are required'}), 400

    try:
        # Assuming 'cart' is the in-memory dictionary
        if item_id in cart:
            cart[item_id]['quantity'] = quantity
            socketio.emit("update_cart", list(cart.values()))
            return jsonify({'message': 'Quantity updated'}), 200
        else:
            return jsonify({'error': 'Item not in cart'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Handle save edited price
@app.route('/update_cart_item_price', methods=['OPTIONS'])
@cross_origin(supports_credentials=True)
def handle_update_cart_item_price_options():
    # This is just for the CORS preflight request
    return '', 200

@app.route('/update_cart_item_price', methods=['POST'])
def update_cart_item_price():
    data = request.json
    item_id = data.get('item_id')
    new_price = data.get('new_price')
    
    if not item_id or not new_price:
        return jsonify({'error': 'Item id or new price is required'}), 400

    try:
        # Use regular client here, assuming item viewing is allowed by RLS
        response = supabase.table('items').select('stock').eq('id', item_id).execute()
        item = response.data[0]
        
        if item['stock'] < 1:
            return jsonify({'error': 'Insufficient stock'}), 400

        # Use service client for updating items
        update_response = supabase_service_client.table('items').update({
            'price': new_price
        }).eq('id', item_id).execute()
        
        if update_response.data:
            return jsonify({'message': 'Item price updated successfully'})
        else:
            return jsonify({'error': 'Failed to update item price'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
        metal_prices = get_metal_prices()
        metal_cost_total = 0

        # Calculate metal costs and update stock
        for i_id, item in cart.items():
            # Use regular client here, assuming item viewing is allowed by RLS
            response = supabase.table('items').select('material_id, weight, stock').eq('id', i_id).execute()
            
            print(f"Supabase response for item {i_id}: {response}") # Debug log
            
            if not response.data:
                print(f"No data returned for item {i_id}") # Debug log
                # Depending on desired behavior, you might want to skip this item or raise an error
                continue # Skip to the next item in the cart if item data is missing

            item_data = response.data[0]

            print(f"Item data for item {i_id}: {item_data}") # Debug log
            
            # Use regular client here, assuming material viewing is allowed by RLS
            material_response = supabase.table('material').select('name').eq('id', item_data['material_id']).execute()
            material_name = material_response.data[0]['name']
            
            if material_name.lower() in ["gold", "silver"] and item_data['weight']:
                rate = metal_prices.get(material_name.capitalize(), 0)
                metal_cost_total += rate * float(item_data['weight']) * item['quantity']
            
            # Update stock and sold count (use service client)
            supabase_service_client.table('items').update({
                'stock': item_data['stock'] - item['quantity'],
                'sold_count': item_data.get('sold_count', 0) + item['quantity']
            }).eq('id', i_id).execute()

        final_total = base_total + float(making_charges) + metal_cost_total

        # Handle customer (Use service client for inserting/fetching customer)
        customer_response = supabase_service_client.table('customers').select('id').eq('contact', customer_contact).execute()
        if customer_response.data:
            customer_id = customer_response.data[0]['id']
        else:
            customer_response = supabase_service_client.table('customers').insert({
                'name': customer_name,
                'contact': customer_contact
            }).execute()
            customer_id = customer_response.data[0]['id']

        # Create order (Use service client)
        order_response = supabase_service_client.table('orders').insert({
            'customer_id': customer_id,
            'total_price': final_total,
            'payment_method': payment_method
        }).execute()
        order_id = order_response.data[0]['id']

        # Create order items (Use service client)
        for i_id, item in cart.items():
            supabase_service_client.table('order_items').insert({
                'order_id': order_id,
                'item_id': i_id,
                'quantity': item['quantity'],
                'price': item['price']
            }).execute()

        # Generate PDF bill
        bills_dir = os.path.join(os.getcwd(), 'bills')
        os.makedirs(bills_dir, exist_ok=True)
        pdf_path = os.path.join(bills_dir, f'order_{order_id}.pdf')

        c = canvas.Canvas(pdf_path)
        c.drawString(100, 800, f'Bill for Order #{order_id}')
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
        # Consider using service client for emitting updates if necessary
        # socketio.emit("update_items", get_items().get_json())

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
@login_required
def get_order_history():
    print("[get_order_history] Function started.") # Debug log
    try:
        print("Fetching order history...")  # Debug log
        print(f"[get_order_history] Current user before logic: {current_user}")  # Explicit Debug log
        print(f"[get_order_history] Is authenticated: {current_user.is_authenticated}") # Explicit Debug log

        # @login_required ensures current_user is authenticated if we reach here.
        response = supabase_service_client.table('orders').select('*, customers(*)').order('order_date', desc=True).execute()
        print(f"Orders response: {response}")  # Debug log

        if not response.data:
            print("No orders found")  # Debug log
            return jsonify([])

        order_list = []
        for order in response.data:
            print(f"Processing order: {order}")  # Debug log
            # Get order items for each order
            items_response = supabase_service_client.table('order_items').select('*, items(*)').eq('order_id', order['id']).execute()
            print(f"Items for order {order['id']}: {items_response}")  # Debug log
            
            order_items = []
            if items_response.data:
                for item in items_response.data:
                    order_items.append({
                        "item_id": item['item_id'],
                        "quantity": item['quantity'],
                        "price": float(item['price']),
                        "item_name": item['items']['name'] if item['items'] else "Unknown Item"
                    })
            
            order_list.append({
                "order_id": order['id'],
                "customer_id": order['customer_id'],
                "total_price": float(order['total_price']),
                "order_date": order['order_date'],
                "payment_method": order['payment_method'],
                "customer_name": order['customers']['name'] if order['customers'] else "Unknown Customer",
                "customer_contact": order['customers']['contact'] if order['customers'] else "N/A",
                "customer_email": order['customers']['email'] if order['customers'] else "N/A",
                "customer_address": order['customers']['address'] if order['customers'] else "N/A",
                "items": order_items
            })
        
        print(f"Returning {len(order_list)} orders")  # Debug log
        return jsonify(order_list)
    except Exception as e:
        print(f"Error fetching order history: {str(e)}")  # Debug log
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
@app.route('/get_users', methods=['GET'])
@login_required
def get_users():
    print("[get_users] Function started.") # Debug log
    try:
        print("Fetching users...")  # Debug log
        print(f"[get_users] Current user before logic: {current_user}")  # Explicit Debug log
        print(f"[get_users] Is authenticated: {current_user.is_authenticated}") # Explicit Debug log

        # @login_required ensures current_user is authenticated if we reach here.
        response = supabase_service_client.table('users').select('id, username, email, role, last_login').execute()
        print(f"Users response: {response}")  # Debug log
        return jsonify(response.data)
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/add_user', methods=['POST'])
@login_required
def add_user():
    data = request.json

    print("Adding user...") # Debug log
    print(f"[add_user] Current user before logic: {current_user}") # Explicit Debug log
    print(f"[add_user] Is authenticated: {current_user.is_authenticated}") # Explicit Debug log

    # @login_required ensures current_user is authenticated if we reach here.

    if not all(key in data for key in ['username', 'email', 'password', 'role']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Check if username or email already exists
        response = supabase_service_client.table('users').select('id').or_(f'username.eq.{data["username"]},email.eq.{data["email"]}').execute()
        if response.data:
            return jsonify({'error': 'Username or email already exists'}), 400
        
        # Hash the password
        password_bytes = data['password'].encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password_bytes, salt)
        
        # Insert the new user
        response = supabase_service_client.table('users').insert({
            'username': data['username'],
            'email': data['email'],
            'password_hash': hashed_password.decode('utf-8'),  # Store as string
            'role': data['role']
        }).execute()
        
        return jsonify({'message': 'User created successfully', 'id': response.data[0]['id']}), 201
    except Exception as e:
        print(f"Error creating user: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/delete_user/<int:user_id>', methods=['DELETE'])
@login_required # Assuming deleting users is only for logged-in users
def delete_user(user_id):
    try:
        # Use service client for deleting users
        supabase_service_client.table('users').delete().eq('id', user_id).execute()
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting user with service client: {e}")
        return jsonify({'error': str(e)}), 500

# --------------------------
# Settings Endpoints
# --------------------------
@app.route('/api/settings/general', methods=['GET'])
@login_required
def get_general_settings():
    try:
        # Use service client to fetch settings
        response = supabase_service_client.table('shop_info').select('*').execute()
        if response.data:
            return jsonify(response.data[0])
        return jsonify({})
    except Exception as e:
        print(f"Error fetching general settings: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/shop/settings', methods=['GET'])
@login_required
def get_shop_settings():
    try:
        # Use service client to fetch shop settings
        response = supabase_service_client.table('shop_info').select('*').execute()
        if response.data:
            return jsonify(response.data[0])
        return jsonify({})
    except Exception as e:
        print(f"Error fetching shop settings: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings/general', methods=['POST'])
@login_required
def update_general_settings():
    try:
        data = request.json
        # Use service client to update settings
        response = supabase_service_client.table('shop_info').upsert(data).execute()
        return jsonify({"message": "Settings updated successfully"})
    except Exception as e:
        print(f"Error updating general settings: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/shop/settings', methods=['POST'])
@login_required
def update_shop_settings():
    try:
        data = request.json
        # Use service client to update shop settings
        response = supabase_service_client.table('shop_info').upsert(data).execute()
        return jsonify({"message": "Shop settings updated successfully"})
    except Exception as e:
        print(f"Error updating shop settings: {e}")
        return jsonify({"error": str(e)}), 500

# --------------------------
# Notification Settings
# --------------------------
@app.route('/api/notifications/settings', methods=['GET', 'POST'])
@login_required
def notification_settings():
    try:
        if request.method == 'GET':
            print("Fetching notification settings...")  # Debug log
            response = supabase_service_client.table('notification_settings').select('*').eq('user_id', current_user.id).execute()
            print(f"Notification settings response: {response}")  # Debug log

            if not response.data:
                # Create default settings if none exist
                default_settings = {
                    'user_id': current_user.id,
                    'settings': {
                        'push': {
                            'enabled': True,
                            'lowStock': True,
                            'orderUpdates': True,
                            'priceUpdates': True,
                            'securityAlerts': True
                        },
                        'email': {
                            'enabled': True,
                            'lowStock': True,
                            'orderUpdates': True,
                            'priceUpdates': True,
                            'securityAlerts': True
                        }
                    }
                }
                response = supabase_service_client.table('notification_settings').insert(default_settings).execute()
                print(f"Created default notification settings: {response}")  # Debug log

            return jsonify(response.data[0] if response.data else {})

        elif request.method == 'POST':
            print("Updating notification settings...")  # Debug log
            data = request.json
            print(f"Received settings data: {data}")  # Debug log

            if not data or 'settings' not in data:
                return jsonify({'error': 'Invalid settings data'}), 400

            # Update or insert settings
            response = supabase_service_client.table('notification_settings').upsert({
                'user_id': current_user.id,
                'settings': data['settings']
            }, on_conflict='user_id').execute()

            print(f"Settings update response: {response}")  # Debug log
            return jsonify(response.data[0] if response.data else {})

    except Exception as e:
        print(f"Error in notification settings: {e}")
        return jsonify({'error': str(e)}), 500

# --------------------------
# Data Export
# --------------------------
@app.route('/api/data/export', methods=['GET'])
@login_required
def export_data():
    try:
        print("Exporting data...")  # Debug log
        # Export orders
        orders = supabase_service_client.table('orders').select('*, customers(*), order_items(*, items(*))').execute()
        # Export items
        items = supabase_service_client.table('items').select('*').execute()
        # Export categories
        categories = supabase_service_client.table('category').select('*').execute()
        # Export materials
        materials = supabase_service_client.table('material').select('*').execute()

        export_data = {
            'orders': orders.data,
            'items': items.data,
            'categories': categories.data,
            'materials': materials.data
        }

        return jsonify(export_data)
    except Exception as e:
        print(f"Error exporting data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/check_session', methods=['GET'])
def check_session():
    """Check if the current session is valid"""
    print("Checking session...") # Debug log
    print(f"Current user in check_session: {current_user}") # Debug log
    if current_user.is_authenticated:
        print("User is authenticated in check_session.") # Debug log
        response = jsonify({
            'authenticated': True,
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'role': current_user.role
            }
        })
        return response
    print("User is NOT authenticated in check_session.") # Debug log
    response = jsonify({
        'authenticated': False,
        'message': 'Session expired or invalid'
    })
    response.status_code = 401
    return response

# Add security test endpoint
@app.route('/api/security/test', methods=['GET'])
@login_required
def test_security():
    return jsonify({
        'status': 'success',
        'message': 'Security test passed',
        'user': {
            'id': current_user.id,
            'username': current_user.username,
            'role': current_user.role
        }
    })

@app.route('/api/security/update-account', methods=['OPTIONS'])
def handle_update_account_options():
    print("Handling OPTIONS for /api/security/update-account explicitly") # Debug log
    response = app.make_default_options_response()
    # Add CORS headers explicitly for this OPTIONS response to be safe
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS') # Explicitly allow POST and OPTIONS for this route
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '3600') # Cache preflight response
    return response

@app.route('/api/security/update-account', methods=['POST'])
@login_required
def update_account():
    print("Security update route hit with POST")  # Debug log
    # Original implementation for POST request handling
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

        # Get user from Supabase using service client (bypassing RLS)
        user_response = supabase_service_client.table('users').select('*').eq('id', current_user.id).execute()
        
        if not user_response.data:
            print("User not found in Supabase")  # Debug log
            return jsonify({'error': 'User not found'}), 404
            
        user = user_response.data[0]
        stored_hash = user.get('password_hash')
        current_email = user.get('email')
        
        # Verify the current password using bcrypt
        if not bcrypt.checkpw(current_password.encode('utf-8'), stored_hash.encode('utf-8')):
            print("Invalid current password")  # Debug log
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        update_fields = {}
        
        # Update username if provided
        if new_username:
            print("Updating username")  # Debug log
            # Check if username already exists (excluding current user)
            existing_user_response = supabase_service_client.table('users').select('id').eq('username', new_username).neq('id', current_user.id).execute()
            if existing_user_response.data:
                print("Username already exists")  # Debug log
                return jsonify({'error': 'Username already exists'}), 400
                
            update_fields["username"] = new_username

        # Update email if provided
        if new_email:
            print("Updating email")  # Debug log
            # Check if email already exists (excluding current user)
            existing_user_response = supabase_service_client.table('users').select('id').eq('email', new_email).neq('id', current_user.id).execute()
            if existing_user_response.data:
                print("Email already exists")  # Debug log
                return jsonify({'error': 'Email already exists'}), 400
                
            update_fields["email"] = new_email
            
            # Send notification email about email change (assuming mail is configured)
            # send_security_notification(
            #     new_email,
            #     'email_change',
            #     {
            #         'old_email': current_email,
            #         'new_email': new_email
            #     }
            # )

        # Update password if provided
        if new_password:
            print("Updating password")  # Debug log
            hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            update_fields["password_hash"] = hashed_password
            
            # Send notification email about password change (assuming mail is configured)
            # send_security_notification(
            #     current_email,
            #     'password_change',
            #     {}
            # )

        # Perform the update in Supabase using service client
        if update_fields:
            update_response = supabase_service_client.table('users').update(update_fields).eq('id', current_user.id).execute()
            print("Supabase update response:", update_response) # Debug log
            # Check for errors in update_response if needed

        print("Update successful")  # Debug log
        return jsonify({'message': 'Account updated successfully'}), 200
        
    except Exception as e:
        # Log the detailed error on the server side
        print("## Detailed Error in update_account:", str(e))  # Explicit Debug log
        # Return the error message in the JSON response
        return jsonify({'error': str(e)}), 500

# --------------------------
# User Preferences Endpoint
# --------------------------
@app.route('/api/user/preferences', methods=['OPTIONS'])
@cross_origin(supports_credentials=True)
def handle_user_preferences_options():
    # This is just for the CORS preflight request
    return '', 200

@app.route('/api/user/preferences', methods=['GET', 'POST'])
@login_required
def handle_user_preferences():
    user_id = current_user.id

    if request.method == 'GET':
        try:
            print(f"Fetching user preferences for user ID: {user_id}") # Debug log
            response = supabase_service_client.table('user_preferences').select('preferences').eq('user_id', user_id).execute()
            print(f"User preferences response: {response}") # Debug log

            if response.data:
                # Return existing preferences, merging with defaults for new fields
                existing_preferences = response.data[0]['preferences']
                default_preferences = {
                    'price_at_add_item': True,
                    'price_at_billing': False,
                    'show_weight_input': True, # Default to showing weight input
                    # Add other default preferences here later
                }
                # Merge existing preferences over defaults
                user_prefs = {**default_preferences, **existing_preferences}
                return jsonify(user_prefs)
            else:
                # Return default preferences if none exist
                default_preferences = {
                    'price_at_add_item': True, # Default to showing price input in AddItemView
                    'price_at_billing': False, # Default to not primarily handling price in CartView
                    'show_weight_input': True, # Default to showing weight input
                    # Add other default preferences here later
                }
                print("No preferences found, returning defaults.") # Debug log
                return jsonify(default_preferences)

        except Exception as e:
            print(f"Error fetching user preferences: {str(e)}") # Debug log
            return jsonify({'error': 'Failed to fetch preferences', 'details': str(e)}), 500

    elif request.method == 'POST':
        try:
            data = request.json
            print(f"Received user preferences data for user ID {user_id}: {data}") # Debug log

            # Validate incoming preference data structure if needed
            # Ensure required fields are present, provide defaults if not.
            preferences_to_save = {
                'price_at_add_item': data.get('price_at_add_item', True), # Default to True if not provided
                'price_at_billing': data.get('price_at_billing', False), # Default to False if not provided
                'show_weight_input': data.get('show_weight_input', True), # Default to True if not provided
                # Add other preferences here
            }

            # Use upsert to insert or update preferences, specifying the conflict column
            response = supabase_service_client.table('user_preferences').upsert({
                'user_id': user_id,
                'preferences': preferences_to_save # Save the entire preferences object
            }, on_conflict='user_id').execute()

            print(f"User preferences upsert response: {response}") # Debug log

            # Check for errors in the upsert response
            if response.data is None and response.error:
                 print(f"Supabase Upsert Error (preferences): {response.error}") # Debug log
                 return jsonify({'error': response.error.message}), 500

            return jsonify({'message': 'Preferences saved successfully'}), 200

        except Exception as e:
            print(f"Error saving user preferences: {str(e)}") # Debug log
            return jsonify({'error': 'Failed to save preferences', 'details': str(e)}), 500

@app.route('/get_cart', methods=['GET'])
def get_cart():
    """Returns the current state of the in-memory cart"""
    print("Fetching cart items...") # Debug log
    return jsonify(list(cart.values()))

if __name__ == '__main__':
    # Initialize the database
    with app.app_context():
        initialize_database()
    # Run the Flask application with SocketIO
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
