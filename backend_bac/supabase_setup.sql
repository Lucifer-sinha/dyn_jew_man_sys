-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES category(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    visibility BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE material (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    unique_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES category(id) ON DELETE SET NULL,
    material_id INTEGER REFERENCES material(id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL,
    weight DECIMAL(10,2),
    stock INTEGER NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    sold_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item_images (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    image_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    total_price DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE TABLE shop_info (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    contact VARCHAR(100),
    email VARCHAR(100),
    address TEXT,
    logo_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(10) DEFAULT 'INR',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_category_parent_id ON category(parent_id);
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_items_material_id ON items(material_id);
CREATE INDEX idx_item_images_item_id ON item_images(item_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_id ON order_items(item_id);

-- Enable Row Level Security (RLS)
ALTER TABLE category ENABLE ROW LEVEL SECURITY;
ALTER TABLE material ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON category FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON material FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON item_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON notification_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON shop_info FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON user_settings FOR SELECT TO authenticated USING (true);

-- Create policies for service role
CREATE POLICY "Enable all access for service role" ON category FOR ALL TO service_role USING (true);
CREATE POLICY "Enable all access for service role" ON material FOR ALL TO service_role USING (true);
CREATE POLICY "Enable all access for service role" ON customers FOR ALL TO service_role USING (true);
CREATE POLICY "Enable all access for service role" ON items FOR ALL TO service_role USING (true);
CREATE POLICY "Enable all access for service role" ON item_images FOR ALL TO service_role USING (true);
CREATE POLICY "Enable all access for service role" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Enable all access for service role" ON orders FOR ALL TO service_role USING (true);
CREATE POLICY "Enable all access for service role" ON order_items FOR ALL TO service_role USING (true);
CREATE POLICY "Enable all access for service role" ON notification_settings FOR ALL TO service_role USING (true);
CREATE POLICY "Enable all access for service role" ON shop_info FOR ALL TO service_role USING (true);
CREATE POLICY "Enable all access for service role" ON user_settings FOR ALL TO service_role USING (true); 