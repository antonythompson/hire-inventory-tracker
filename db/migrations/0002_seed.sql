-- Seed data

-- Default admin user (password: admin123)
-- Hash is SHA-256 of 'admin123'
INSERT INTO users (email, password_hash, name) VALUES
  ('admin@fanfare.co.nz', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Admin');

-- Catalog items from fanfarenz.com/hiring/

-- Tables
INSERT INTO catalog_items (name, category, description) VALUES
  ('1.2M Table', 'Tables', 'Small round/rectangular table'),
  ('1.8M Table', 'Tables', 'Large round/rectangular table'),
  ('Trestle Table', 'Tables', 'Standard trestle table'),
  ('Kids Table', 'Tables', 'Small table for children');

-- Chairs
INSERT INTO catalog_items (name, category, description) VALUES
  ('Black Padded Chair', 'Chairs', 'Black padded folding chair'),
  ('White Plastic Chair', 'Chairs', 'Standard white plastic chair'),
  ('White Chair (Premium)', 'Chairs', 'Premium white chair'),
  ('Traditional Gold & Maroon Chair', 'Chairs', 'Decorative gold and maroon chair'),
  ('Kids Chair', 'Chairs', 'Small chair for children'),
  ('Red Chair', 'Chairs', 'Red decorative chair');

-- Chair Covers & Sashes
INSERT INTO catalog_items (name, category, description) VALUES
  ('Chair Cover (White)', 'Chair Covers', 'White stretch chair cover'),
  ('Chair Cover (Black)', 'Chair Covers', 'Black stretch chair cover'),
  ('Chair Tie/Bow', 'Chair Covers', 'Decorative chair sash/bow');

-- Table Covers
INSERT INTO catalog_items (name, category, description) VALUES
  ('Trestle Table Cover', 'Table Covers', 'Cover for trestle table'),
  ('White Table Cover', 'Table Covers', 'White tablecloth'),
  ('Black Table Cover', 'Table Covers', 'Black tablecloth'),
  ('Green Table Runner', 'Table Covers', 'Green table runner');

-- Couches & Sofas
INSERT INTO catalog_items (name, category, description) VALUES
  ('Big White Chaise Couch', 'Couches & Sofas', 'Large white chaise lounge'),
  ('Gold Leaf Chaise', 'Couches & Sofas', 'Gold leaf decorative chaise'),
  ('Low White Couch', 'Couches & Sofas', 'Low-profile white couch'),
  ('White Sofa', 'Couches & Sofas', 'White sofa');

-- Pedestals & Plinths
INSERT INTO catalog_items (name, category, description) VALUES
  ('Ganesh White Pedestal', 'Pedestals & Plinths', 'White decorative pedestal'),
  ('White Cylinder Plinth (Small)', 'Pedestals & Plinths', 'Small white cylinder plinth'),
  ('White Cylinder Plinth (Medium)', 'Pedestals & Plinths', 'Medium white cylinder plinth'),
  ('White Cylinder Plinth (Large)', 'Pedestals & Plinths', 'Large white cylinder plinth'),
  ('Premium Golden Pedestal', 'Pedestals & Plinths', 'Gold decorative pedestal');

-- Backdrops
INSERT INTO catalog_items (name, category, description) VALUES
  ('Pink/Blue Backdrop', 'Backdrops', 'Pink and blue backdrop'),
  ('Shiny Gold Round Arch', 'Backdrops', 'Gold circular arch backdrop'),
  ('White Backdrop Drapes', 'Backdrops', 'White draping backdrop'),
  ('White Backdrop', 'Backdrops', 'Standard white backdrop');

-- Decorations
INSERT INTO catalog_items (name, category, description) VALUES
  ('Cake Table Decorations', 'Decorations', 'Decorative setup for cake table'),
  ('Flower Arrangements', 'Decorations', 'Floral decorations'),
  ('Fairy Lights', 'Decorations', 'String fairy lights'),
  ('Lanterns', 'Decorations', 'Decorative lanterns');

-- Audio Equipment
INSERT INTO catalog_items (name, category, description) VALUES
  ('Speakers with Mic', 'Audio', 'Speaker system with microphone');
