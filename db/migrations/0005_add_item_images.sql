-- Add image_url column to catalog_items for R2 image storage

ALTER TABLE catalog_items ADD COLUMN image_url TEXT;
