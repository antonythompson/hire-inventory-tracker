-- Add user roles and username (idempotent)

-- Add role column if it doesn't exist
-- SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we use a trick
-- This will fail silently if column exists (caught by migration runner)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'staff';

-- Add is_active column
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;

-- Add username column
ALTER TABLE users ADD COLUMN username TEXT;

-- Create unique index for username (allows NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Update existing admin user
UPDATE users SET role = 'admin', username = 'admin' WHERE email = 'admin@fanfare.co.nz' AND role IS NULL;
