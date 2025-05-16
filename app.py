from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import os
import json
from datetime import datetime
from functools import wraps
import requests  # For Firebase token verification
import glob

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Add custom Jinja filters
@app.template_filter('date')
def format_date(value):
    if not value:
        return ""
    try:
        dt = datetime.fromisoformat(value)
        return dt.strftime("%B %d, %Y")
    except:
        return value

# Data storage (in a real app, use a database)
USERS_FILE = 'data/users.json'
ORDERS_FILE = 'data/orders.json'
PRODUCTS_FILE = 'data/products.json'

# Products per page for pagination
PRODUCTS_PER_PAGE = 20

# Firebase project ID for token verification
FIREBASE_PROJECT_ID = "gamehub-ef5c4"

# Ensure data directories exist
os.makedirs('data', exist_ok=True)

# Helper function to get image files and their categories
def get_product_images():
    image_files = glob.glob('static/images/*.jpg') + glob.glob('static/images/*.jpeg') + glob.glob('static/images/*.png')
    products = []
    
    for i, image_path in enumerate(image_files, start=1):
        # Get just the filename without path
        filename = os.path.basename(image_path)
        base_name = os.path.splitext(filename)[0].lower()
        
        # Try to extract category from filename (e.g., "footwear - shoe" -> "footwear")
        parts = base_name.split('-')
        category = parts[0].strip() if len(parts) > 1 else 'unknown'
        
        # Clean up category to match expected values
        if 'shoe' in base_name or 'footwear' in base_name:
            category = 'footwear'
        elif 'tshert' in base_name or 'clothing' in base_name or 'wear' in base_name:
            category = 'clothing'
        else:
            category = 'accessories'
        
        # Generate a product name from the filename
        name_parts = base_name.split('-')
        if len(name_parts) > 1:
            name = f"{name_parts[0].capitalize()} {name_parts[1].capitalize()}"
        else:
            name = base_name.capitalize().replace('_', ' ')
        
        # Generate random price based on category
        if category == 'footwear':
            price = 89.99 + (i % 5) * 10
        elif category == 'clothing':
            price = 29.99 + (i % 5) * 10
        else:
            price = 19.99 + (i % 7) * 5
        
        # Normalize image path for web use - always use forward slashes
        web_path = '/' + image_path.replace('\\', '/')
        
        products.append({
            'id': i,
            'name': name,
            'price': price,
            'image': web_path,
            'category': category,
            'description': f"A premium quality {name.lower()} in our {category} collection.",
            'stock': 10 + (i % 5),
            'rating': 3.5 + (i % 5) * 0.5,
            'reviews': []
        })
    
    return products

# Initialize data files if they don't exist
def initialize_data_files():
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump({
                "stealstore@gmail.com": {
                    "password": generate_password_hash("mayank@9056"),
                    "name": "Admin User",
                    "role": "admin",
                    "created_at": datetime.now().isoformat()
                }
            }, f)
    
    if not os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE, 'w') as f:
            json.dump([], f)
    
    # Always regenerate product data from images
    # Generate products from actual images
    products = get_product_images()
    
    # If no images found, use these defaults
    if not products:
        products = [
            {
                'id': 1,
                'name': 'Premium Black Jacket',
                'price': 199.99,
                'image': 'static/images/product1.jpg',
                'category': 'clothing',
                'description': 'A premium quality black jacket made with the finest materials.',
                'stock': 10,
                'rating': 4.5,
                'reviews': []
            },
            {
                'id': 2,
                'name': 'Minimalist Watch',
                'price': 149.99,
                'image': 'static/images/product2.jpg',
                'category': 'accessories',
                'description': 'A sleek minimalist watch that complements any style.',
                'stock': 15,
                'rating': 4.2,
                'reviews': []
            },
            {
                'id': 3,
                'name': 'Designer Sunglasses',
                'price': 89.99,
                'image': 'static/images/product3.jpg',
                'category': 'accessories',
                'description': 'Stylish designer sunglasses offering 100% UV protection.',
                'stock': 20,
                'rating': 4.0,
                'reviews': []
            },
            {
                'id': 4,
                'name': 'Premium Sneakers',
                'price': 129.99,
                'image': 'static/images/product4.jpg',
                'category': 'footwear',
                'description': 'Premium quality sneakers designed for comfort and style.',
                'stock': 8,
                'rating': 4.7,
                'reviews': []
            }
        ]
    
    with open(PRODUCTS_FILE, 'w') as f:
        json.dump(products, f, indent=2)

initialize_data_files()

# Helper functions
def load_data(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)

def save_data(data, file_path):
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def dict_to_obj(dict_data):
    """Convert a dictionary to an object to avoid method name conflicts"""
    class Obj:
        pass
    
    obj = Obj()
    for key, value in dict_data.items():
        setattr(obj, key, value)
    return obj

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session or session['user'].get('role') != 'admin':
            flash('Access denied. Admin privileges required.')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_product(product_id):
    products = load_data(PRODUCTS_FILE)
    for product in products:
        if product['id'] == product_id:
            return product
    return None

def get_paginated_products(page=1, per_page=PRODUCTS_PER_PAGE):
    products = load_data(PRODUCTS_FILE)
    total_products = len(products)
    total_pages = (total_products + per_page - 1) // per_page  # Ceiling division
    
    # Ensure page is within bounds
    page = max(1, min(page, total_pages))
    
    # Calculate start and end indices
    start_idx = (page - 1) * per_page
    end_idx = min(start_idx + per_page, total_products)
    
    return {
        'products': products[start_idx:end_idx],
        'page': page,
        'total_pages': total_pages,
        'total_products': total_products,
        'has_prev': page > 1,
        'has_next': page < total_pages
    }

def verify_firebase_token(id_token):
    """Verify the Firebase ID token and return user info"""
    try:
        # Firebase Auth REST API endpoint for token verification
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyBKebCR5xV4JIKY_I2dvQ2Hp1P4obBHiE4"
        
        # Send request to Firebase Auth
        response = requests.post(url, json={"idToken": id_token})
        data = response.json()
        
        if 'users' in data and len(data['users']) > 0:
            user_info = data['users'][0]
            return {
                'email': user_info.get('email'),
                'name': user_info.get('displayName', 'Google User'),
                'profile_pic': user_info.get('photoUrl'),
                'user_id': user_info.get('localId')
            }
        
        return None
    except Exception as e:
        print(f"Error verifying Firebase token: {e}")
        return None

# Routes
@app.route('/')
def home():
    # For the homepage, show just the first few products
    paginated_data = get_paginated_products(page=1, per_page=8)
    return render_template('index.html', featured_products=paginated_data['products'])

@app.route('/products')
def products():
    page = request.args.get('page', 1, type=int)
    paginated_data = get_paginated_products(page=page)
    return render_template('products.html', 
                          products=paginated_data['products'],
                          page=paginated_data['page'],
                          total_pages=paginated_data['total_pages'],
                          has_prev=paginated_data['has_prev'],
                          has_next=paginated_data['has_next'])

@app.route('/product/<int:product_id>')
def product_detail(product_id):
    product = get_product(product_id)
    if not product:
        flash('Product not found!')
        return redirect(url_for('products'))
    
    # Get similar products (same category)
    products = load_data(PRODUCTS_FILE)
    similar_products = [p for p in products if p['category'] == product['category'] and p['id'] != product['id']]
    # Limit to 4 similar products
    similar_products = similar_products[:4]
    
    return render_template('product_detail.html', product=product, similar_products=similar_products)

@app.route('/buy-now/<int:product_id>')
@login_required
def buy_now(product_id):
    product = get_product(product_id)
    if not product:
        flash('Product not found!')
        return redirect(url_for('products'))
    return render_template('buy_now.html', product=product)

@app.route('/process-buy-now/<int:product_id>', methods=['POST'])
@login_required
def process_buy_now(product_id):
    product = get_product(product_id)
    if not product:
        return jsonify({'success': False, 'error': 'Product not found'})
    
    user = session['user']
    
    # Get address from form
    address = {
        'full_name': request.form.get('full_name'),
        'address': request.form.get('address'),
        'city': request.form.get('city'),
        'country': request.form.get('country'),
        'phone': request.form.get('phone'),
        'instructions': request.form.get('instructions', '')
    }
    
    # Create an order with a single item
    order = {
        'id': str(uuid.uuid4()),
        'user_email': user['email'],
        'user_name': user['name'],
        'items': [{
            'id': product['id'],
            'name': product['name'],
            'price': product['price'],
            'image': product['image'],
            'quantity': 1
        }],
        'total': product['price'],
        'address': address,
        'payment_method': request.form.get('payment_method', 'Cash on Delivery'),
        'status': 'pending',
        'created_at': datetime.now().isoformat()
    }
    
    orders = load_data(ORDERS_FILE)
    orders.append(order)
    save_data(orders, ORDERS_FILE)
    
    # Save address to user profile if checked or if user doesn't have a saved address
    if 'save_address' in request.form or not user.get('address'):
        users = load_data(USERS_FILE)
        saved_address = address.copy()
        if 'instructions' in saved_address:
            del saved_address['instructions']  # Don't save instructions as they're order-specific
        
        users[user['email']]['address'] = saved_address
        session['user']['address'] = saved_address
        save_data(users, USERS_FILE)
    
    # Save to session for order confirmation
    session['last_order'] = order
    
    return jsonify({'success': True, 'order_id': order['id']})

@app.route('/cart')
def cart():
    return render_template('cart.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        name = request.form.get('name')
        
        users = load_data(USERS_FILE)
        
        if email in users:
            flash('Email already exists. Please use a different email or login.')
            return redirect(url_for('register'))
        
        users[email] = {
            'password': generate_password_hash(password),
            'name': name,
            'role': 'user',
            'created_at': datetime.now().isoformat()
        }
        
        save_data(users, USERS_FILE)
        flash('Registration successful! Please login.')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        users = load_data(USERS_FILE)
        
        if email in users and check_password_hash(users[email]['password'], password):
            user = users[email]
            user['email'] = email  # Add email to user dict
            session['user'] = user
            
            next_page = request.args.get('next')
            if next_page:
                return redirect(next_page)
            
            if user['role'] == 'admin':
                return redirect(url_for('admin_dashboard'))
            else:
                return redirect(url_for('home'))
        
        flash('Invalid email or password.')
        return redirect(url_for('login'))
    
    return render_template('login.html')

@app.route('/google-auth', methods=['POST'])
def google_auth():
    id_token = request.form.get('id_token')
    
    if not id_token:
        flash('Authentication failed.')
        return redirect(url_for('login'))
    
    # Verify the ID token with Firebase
    user_info = verify_firebase_token(id_token)
    
    if not user_info:
        flash('Authentication failed. Invalid token.')
        return redirect(url_for('login'))
    
    # Check if the user already exists in our database
    users = load_data(USERS_FILE)
    email = user_info['email']
    
    if email not in users:
        # Create new user
        users[email] = {
            'name': user_info['name'],
            'role': 'user',
            'created_at': datetime.now().isoformat(),
            'google_id': user_info['user_id'],
            'profile_pic': user_info.get('profile_pic', '')
        }
        save_data(users, USERS_FILE)
    
    # Create session
    user = users[email]
    user['email'] = email
    session['user'] = user
    
    # Special case for admin
    if email == 'stealstore@gmail.com':
        return redirect(url_for('admin_dashboard'))
    
    next_page = request.args.get('next')
    if next_page:
        return redirect(next_page)
    
    return redirect(url_for('home'))

@app.route('/logout')
def logout():
    session.pop('user', None)
    flash('You have been logged out.')
    return redirect(url_for('home'))

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        users = load_data(USERS_FILE)
        
        if email in users:
            # In a real app, send a password reset email
            # For now, we'll just simulate it
            flash('Password reset instructions have been sent to your email.')
            return redirect(url_for('login'))
        
        flash('Email not found.')
        return redirect(url_for('forgot_password'))
    
    return render_template('forgot_password.html')

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    # This would validate the token and allow password reset
    # Simplified for demonstration
    if request.method == 'POST':
        flash('Your password has been reset successfully.')
        return redirect(url_for('login'))
    
    return render_template('reset_password.html')

@app.route('/profile')
@login_required
def profile():
    user_email = session['user']['email']
    orders = load_data(ORDERS_FILE)
    # Filter orders for this user and sort by created_at (newest first)
    user_orders = [order for order in orders if order.get('user_email') == user_email]
    # Sort orders by created_at (newest first) if possible
    try:
        user_orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    except:
        pass  # Skip sorting if there's an issue
    
    # Convert order dicts to objects to avoid 'items' method conflict
    order_objects = [dict_to_obj(order) for order in user_orders]
    
    return render_template('profile.html', orders=order_objects)

@app.route('/update-profile', methods=['POST'])
@login_required
def update_profile():
    user_email = session['user']['email']
    users = load_data(USERS_FILE)
    
    update_type = request.form.get('update_type')
    
    if update_type == 'name':
        name = request.form.get('name')
        if name:
            # Update name in the users database
            users[user_email]['name'] = name
            # Update the session
            session['user']['name'] = name
            flash('Your name has been updated successfully.')
    
    elif update_type == 'address':
        # Get address data
        address = {
            'full_name': request.form.get('full_name'),
            'address': request.form.get('address'),
            'city': request.form.get('city'),
            'country': request.form.get('country'),
            'phone': request.form.get('phone')
        }
        
        # Update address in users database
        users[user_email]['address'] = address
        # Update the session
        session['user']['address'] = address
        flash('Your address has been updated successfully.')
    
    # Save changes to users file
    save_data(users, USERS_FILE)
    
    return redirect(url_for('profile'))

@app.route('/checkout', methods=['GET', 'POST'])
@login_required
def checkout():
    if request.method == 'POST':
        user = session['user']
        cart_data = request.form.get('cart_data')
        
        if not cart_data:
            flash('Your cart is empty.')
            return redirect(url_for('cart'))
        
        cart_items = json.loads(cart_data)
        
        # Get form data with fallbacks to saved user address if available
        address = {
            'full_name': request.form.get('full_name'),
            'address': request.form.get('address'),
            'city': request.form.get('city'),
            'country': request.form.get('country'),
            'phone': request.form.get('phone'),
            'instructions': request.form.get('instructions', '')
        }
        
        order = {
            'id': str(uuid.uuid4()),
            'user_email': user['email'],
            'user_name': user['name'],
            'items': cart_items,
            'total': float(request.form.get('total')),
            'address': address,
            'payment_method': 'Cash on Delivery',
            'status': 'pending',
            'created_at': datetime.now().isoformat()
        }
        
        orders = load_data(ORDERS_FILE)
        orders.append(order)
        save_data(orders, ORDERS_FILE)
        
        # Save address to user profile if not already saved
        if 'save_address' in request.form or not user.get('address'):
            users = load_data(USERS_FILE)
            saved_address = address.copy()
            if 'instructions' in saved_address:
                del saved_address['instructions']  # Don't save instructions as they're order-specific
            
            users[user['email']]['address'] = saved_address
            session['user']['address'] = saved_address
            save_data(users, USERS_FILE)
        
        # In a real app, send confirmation email here
        
        # Store order in session
        session['last_order'] = order
        return redirect(url_for('order_confirmation'))
    
    return render_template('checkout.html')

@app.route('/order-confirmation')
@login_required
def order_confirmation():
    if 'last_order' not in session:
        return redirect(url_for('home'))
    
    order = session['last_order']
    
    # Convert order dict to an object to avoid 'items' method conflict
    order_obj = dict_to_obj(order)
    
    return render_template('order_confirmation.html', order=order_obj)

# Admin routes
@app.route('/admin')
@admin_required
def admin_dashboard():
    users = load_data(USERS_FILE)
    orders = load_data(ORDERS_FILE)
    products = load_data(PRODUCTS_FILE)
    
    # Calculate some basic analytics
    total_sales = sum(order['total'] for order in orders)
    pending_orders = len([order for order in orders if order['status'] == 'pending'])
    total_users = len([user for user in users.values() if user['role'] == 'user'])
    
    # Get live orders (pending or processing)
    live_orders = [order for order in orders if order['status'] in ['pending', 'processing']]
    
    # Convert live orders to objects to avoid 'items' method conflict
    live_orders_list = [dict_to_obj(order) for order in live_orders]
    
    # Convert recent orders to objects
    recent_orders = [dict_to_obj(order) for order in orders[:5]]
    
    return render_template('admin/dashboard.html', 
                         total_sales=total_sales,
                         pending_orders=pending_orders,
                         total_users=total_users,
                         live_orders=len(live_orders),
                         live_orders_list=live_orders_list,
                         orders=recent_orders)  # Show latest 5 orders

@app.route('/admin/users')
@admin_required
def admin_users():
    users = load_data(USERS_FILE)
    user_list = [{'email': email, **data} for email, data in users.items()]
    return render_template('admin/users.html', users=user_list)

@app.route('/admin/orders')
@admin_required
def admin_orders():
    orders = load_data(ORDERS_FILE)
    # Convert orders to objects to avoid 'items' method conflict
    order_objects = [dict_to_obj(order) for order in orders]
    return render_template('admin/orders.html', orders=order_objects)

@app.route('/admin/order/<order_id>')
@admin_required
def admin_order_detail(order_id):
    orders = load_data(ORDERS_FILE)
    order = next((o for o in orders if o['id'] == order_id), None)
    
    if not order:
        flash('Order not found!')
        return redirect(url_for('admin_orders'))
    
    # Convert order dict to an object to avoid 'items' method conflict
    order_obj = dict_to_obj(order)
    
    return render_template('admin/order_detail.html', order=order_obj)

@app.route('/admin/update-order-status', methods=['POST'])
@admin_required
def update_order_status():
    order_id = request.form.get('order_id')
    new_status = request.form.get('status')
    
    orders = load_data(ORDERS_FILE)
    for order in orders:
        if order['id'] == order_id:
            order['status'] = new_status
            save_data(orders, ORDERS_FILE)
            flash(f'Order status updated to {new_status}.')
            break
    
    return redirect(url_for('admin_order_detail', order_id=order_id))

@app.route('/admin/products')
@admin_required
def admin_products():
    products = load_data(PRODUCTS_FILE)
    return render_template('admin/products.html', products=products)

@app.route('/admin/add-product', methods=['GET', 'POST'])
@admin_required
def admin_add_product():
    if request.method == 'POST':
        products = load_data(PRODUCTS_FILE)
        new_id = max(product['id'] for product in products) + 1 if products else 1
        
        new_product = {
            'id': new_id,
            'name': request.form.get('name'),
            'price': float(request.form.get('price')),
            'image': request.form.get('image'),  # In a real app, handle file upload
            'category': request.form.get('category'),
            'description': request.form.get('description'),
            'stock': int(request.form.get('stock')),
            'rating': 0,
            'reviews': []
        }
        
        products.append(new_product)
        save_data(products, PRODUCTS_FILE)
        
        flash('Product added successfully!')
        return redirect(url_for('admin_products'))
    
    return render_template('admin/add_product.html')

@app.route('/admin/edit-product/<int:product_id>', methods=['GET', 'POST'])
@admin_required
def admin_edit_product(product_id):
    products = load_data(PRODUCTS_FILE)
    product = next((p for p in products if p['id'] == product_id), None)
    
    if not product:
        flash('Product not found!')
        return redirect(url_for('admin_products'))
    
    if request.method == 'POST':
        # Update product with form data
        product['name'] = request.form.get('name')
        product['price'] = float(request.form.get('price'))
        product['category'] = request.form.get('category')
        product['description'] = request.form.get('description')
        product['stock'] = int(request.form.get('stock'))
        product['image'] = request.form.get('image')
        
        # Save changes
        save_data(products, PRODUCTS_FILE)
        
        flash('Product updated successfully!')
        return redirect(url_for('admin_products'))
    
    return render_template('admin/edit_product.html', product=product)

@app.route('/api/delete-product', methods=['POST'])
@admin_required
def delete_product():
    try:
        product_id = int(request.form.get('product_id'))
        products = load_data(PRODUCTS_FILE)
        
        # Find product index
        product_index = next((i for i, p in enumerate(products) if p['id'] == product_id), None)
        
        if product_index is None:
            return jsonify({'success': False, 'error': 'Product not found'})
        
        # Remove product
        del products[product_index]
        save_data(products, PRODUCTS_FILE)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# API routes for AJAX requests
@app.route('/api/update-product-stock', methods=['POST'])
@admin_required
def update_product_stock():
    product_id = int(request.form.get('product_id'))
    new_stock = int(request.form.get('stock'))
    
    products = load_data(PRODUCTS_FILE)
    for product in products:
        if product['id'] == product_id:
            product['stock'] = new_stock
            save_data(products, PRODUCTS_FILE)
            return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Product not found'})

@app.route('/api/get-notifications', methods=['GET'])
@admin_required
def get_notifications():
    orders = load_data(ORDERS_FILE)
    new_orders = [order for order in orders if order['status'] == 'pending']
    return jsonify({
        'new_orders_count': len(new_orders),
        'new_orders': new_orders[:5]  # Return latest 5 new orders
    })

# Settings and preferences
@app.route('/update-theme', methods=['POST'])
def update_theme():
    theme = request.form.get('theme')
    session['theme'] = theme
    return redirect(request.referrer or url_for('home'))

# Debug route to view all detected images
@app.route('/debug/images')
def debug_images():
    image_files = glob.glob('static/images/*.jpg') + glob.glob('static/images/*.jpeg') + glob.glob('static/images/*.png')
    return render_template('debug_images.html', 
                          image_files=image_files, 
                          count=len(image_files),
                          products=get_product_images())

@app.route('/products/all')
def all_products():
    """Show all products on a single page"""
    products = load_data(PRODUCTS_FILE)
    return render_template('products.html', 
                          products=products,
                          page=1,
                          total_pages=1,
                          has_prev=False,
                          has_next=False,
                          show_all=True)

@app.route('/about')
def about():
    """About page with company info and order guide"""
    return render_template('about.html')

if __name__ == '__main__':
    app.run(debug=True) 