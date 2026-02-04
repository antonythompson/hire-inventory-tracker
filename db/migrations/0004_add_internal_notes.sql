-- Test migration (can be deleted after testing)
-- This just adds a comment column to orders that we might actually want

ALTER TABLE orders ADD COLUMN internal_notes TEXT;
