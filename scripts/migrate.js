#!/usr/bin/env node

/**
 * Migration runner for D1 database
 * Usage: node scripts/migrate.js [--remote]
 *
 * Similar to `php artisan migrate` - tracks which migrations have run
 * and only executes new ones.
 */

import { execSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const MIGRATIONS_DIR = join(PROJECT_ROOT, 'db', 'migrations');
const DATABASE_NAME = 'hire-tracker';

// Check if running against remote database
const isRemote = process.argv.includes('--remote') || process.argv.includes('-r');
const remoteFlag = isRemote ? '--remote' : '--local';

console.log(`\n🗄️  Running migrations (${isRemote ? 'PRODUCTION' : 'local'})...\n`);

/**
 * Execute a D1 command and return the result
 */
function d1Execute(command, silent = false) {
  try {
    const cmd = `npx wrangler d1 execute ${DATABASE_NAME} ${remoteFlag} --command "${command.replace(/"/g, '\\"')}" --json`;
    const result = execSync(cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      stdio: silent ? ['pipe', 'pipe', 'pipe'] : ['pipe', 'pipe', 'inherit']
    });
    return JSON.parse(result);
  } catch (error) {
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        // Not JSON, probably an error message
      }
    }
    throw error;
  }
}

/**
 * Execute a SQL file
 */
function d1ExecuteFile(filePath) {
  const cmd = `npx wrangler d1 execute ${DATABASE_NAME} ${remoteFlag} --file="${filePath}"`;
  execSync(cmd, {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
    stdio: 'inherit'
  });
}

/**
 * Ensure the migrations table exists
 */
function ensureMigrationsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `;
  d1Execute(sql, true);
}

/**
 * Get list of already-executed migrations
 */
function getExecutedMigrations() {
  try {
    const result = d1Execute('SELECT name FROM _migrations ORDER BY name', true);
    if (result && result[0] && result[0].results) {
      return result[0].results.map(row => row.name);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Record a migration as executed
 */
function recordMigration(name) {
  d1Execute(`INSERT INTO _migrations (name) VALUES ('${name}')`, true);
}

/**
 * Get all migration files sorted by name
 */
function getMigrationFiles() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  return files;
}

/**
 * Main migration runner
 */
async function migrate() {
  // Ensure migrations table exists
  console.log('📋 Checking migrations table...');
  ensureMigrationsTable();

  // Get executed and pending migrations
  const executed = getExecutedMigrations();
  const allMigrations = getMigrationFiles();
  const pending = allMigrations.filter(m => !executed.includes(m));

  if (pending.length === 0) {
    console.log('✅ Nothing to migrate. Database is up to date.\n');
    return;
  }

  console.log(`📦 Found ${pending.length} pending migration(s):\n`);
  pending.forEach(m => console.log(`   - ${m}`));
  console.log('');

  // Run each pending migration
  for (const migration of pending) {
    const filePath = join(MIGRATIONS_DIR, migration);
    console.log(`🚀 Running: ${migration}`);

    try {
      d1ExecuteFile(filePath);
      recordMigration(migration);
      console.log(`   ✅ Completed\n`);
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      process.exit(1);
    }
  }

  console.log('✅ All migrations completed successfully!\n');
}

// Run migrations
migrate().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
