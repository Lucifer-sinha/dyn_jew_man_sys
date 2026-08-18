-- Insert Categories
INSERT INTO category (name, parent_id, sort_order, visibility) VALUES
('Men', NULL, 1, true),
('Women', NULL, 2, true),
('Kids', NULL, 3, true),
('Others', NULL, 4, true);

-- Insert Subcategories for Men
INSERT INTO category (name, parent_id, sort_order, visibility) VALUES
('Rings', 1, 1, true),
('Chains', 1, 2, true),
('Earrings', 1, 3, true);

-- Insert Subcategories for Women
INSERT INTO category (name, parent_id, sort_order, visibility) VALUES
('Necklaces', 2, 1, true),
('Bangles', 2, 2, true),
('Earrings', 2, 3, true),
('Nose Pins', 2, 4, true);

-- Insert Materials
INSERT INTO material (name) VALUES
('Gold'),
('Silver'),
('Diamond'),
('Platinum');

-- Insert Customers
INSERT INTO customers (name, contact, email, address) VALUES
('John Smith', '9876543210', 'john@example.com', '123 Main St, City'),
('Emma Wilson', '8765432109', 'emma@example.com', '456 Park Ave, Town'),
('Michael Brown', '7654321098', 'michael@example.com', '789 Oak Rd, Village');

-- Insert Users
INSERT INTO users (username, password_hash, role, email) VALUES
('admin', '$2b$12$c.hQAGzSz.O8vDaT7G4H/Omvh9g0WTNMnjYgIDx6dw3i3vNR.23TW', 'admin', 'admin@example.com'),
('manager', '$2b$12$koCNQT3IGgZyR1.9qRocgOnP89unMjpdtqU3P/uvxvzQxI8MNlIhq', 'manager', 'manager@jewelry.com');

-- Insert Items
INSERT INTO items (unique_id, name, category_id, material_id, price, weight, stock, description) VALUES
('GOLD-RING-001', 'Classic Gold Ring', 5, 1, 25000.00, 10.5, 5, 'Traditional gold ring with intricate design'),
('SILVER-CHAIN-001', 'Silver Chain Necklace', 8, 2, 15000.00, 25.0, 8, 'Elegant silver chain necklace'),
('DIAMOND-EAR-001', 'Diamond Stud Earrings', 10, 3, 45000.00, 5.0, 3, 'Beautiful diamond stud earrings'),
('PLAT-RING-001', 'Platinum Wedding Ring', 5, 4, 35000.00, 8.0, 4, 'Modern platinum wedding ring');

-- Insert Orders
INSERT INTO orders (customer_id, total_price, payment_method, order_date) VALUES
(1, 25000.00, 'Credit Card', CURRENT_TIMESTAMP),
(2, 60000.00, 'UPI', CURRENT_TIMESTAMP),
(3, 15000.00, 'Cash', CURRENT_TIMESTAMP);

-- Insert Order Items
INSERT INTO order_items (order_id, item_id, quantity, price) VALUES
(1, 1, 1, 25000.00),
(2, 3, 1, 45000.00),
(2, 4, 1, 15000.00),
(3, 2, 1, 15000.00);

-- Insert Notification Settings
INSERT INTO notification_settings (user_id, settings) VALUES
(1, '{"push": {"enabled": true, "lowStock": true, "orderUpdates": true, "priceUpdates": true, "securityAlerts": true}, "email": {"enabled": true, "lowStock": true, "orderUpdates": true, "priceUpdates": true, "securityAlerts": true}}');

-- Insert Shop Info
INSERT INTO shop_info (name, contact, email, address) VALUES
('Royal Jewelers', '1800-123-4567', 'contact@royaljewelers.com', '123 Jewelry Street, Diamond District');

-- Insert User Settings
INSERT INTO user_settings (user_id, language, currency, timezone, date_format) VALUES
(1, 'en', 'INR', 'Asia/Kolkata', 'DD/MM/YYYY'),
(2, 'en', 'INR', 'Asia/Kolkata', 'DD/MM/YYYY'); 