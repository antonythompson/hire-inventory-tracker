-- Seed data

-- Default admin user (password: admin123)
-- Hash is SHA-256 of 'admin123'
INSERT INTO users (email, password_hash, name) VALUES
  ('admin@fanfare.co.nz', '240be518fabd2724ddb6f04eeb9d5b87d5b1e7ed6d87e7be313d5e3b2b23e8d3', 'Admin');

-- Sample catalog items
INSERT INTO catalog_items (name, category, description) VALUES
  ('Folding Chair (White)', 'Furniture', 'Standard white folding chair'),
  ('Folding Chair (Black)', 'Furniture', 'Standard black folding chair'),
  ('Round Table (6ft)', 'Furniture', '6 foot round banquet table'),
  ('Round Table (5ft)', 'Furniture', '5 foot round banquet table'),
  ('Trestle Table (6ft)', 'Furniture', '6 foot rectangular trestle table'),
  ('Trestle Table (8ft)', 'Furniture', '8 foot rectangular trestle table'),
  ('White Tablecloth (Round)', 'Linen', 'White cloth for round tables'),
  ('White Tablecloth (Rect)', 'Linen', 'White cloth for rectangular tables'),
  ('Black Tablecloth (Round)', 'Linen', 'Black cloth for round tables'),
  ('Black Tablecloth (Rect)', 'Linen', 'Black cloth for rectangular tables'),
  ('Chair Cover (White)', 'Linen', 'Stretch chair cover - white'),
  ('Chair Cover (Black)', 'Linen', 'Stretch chair cover - black'),
  ('Napkin (White)', 'Linen', 'Cloth napkin - white'),
  ('Napkin (Black)', 'Linen', 'Cloth napkin - black'),
  ('Centerpiece Vase', 'Decor', 'Glass vase for table centerpieces'),
  ('Fairy Lights (10m)', 'Decor', '10 meter string of fairy lights'),
  ('Lantern (Large)', 'Decor', 'Large decorative lantern'),
  ('Lantern (Small)', 'Decor', 'Small decorative lantern');
