// src/database/Database.ts
// ─────────────────────────────────────────────────────────────
import { open, QuickSQLiteConnection } from 'react-native-quick-sqlite';
let db: QuickSQLiteConnection | null = null;

export function getDb(): QuickSQLiteConnection {
  if (!db) throw new Error('DB not initialized');
  return db;
}

export function initDb(): void {
  db = open({ name: 'somus.db' });
  db.execute(`CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY, sms_id TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL, currency_code TEXT NOT NULL,
    merchant TEXT DEFAULT '', category TEXT NOT NULL, type TEXT NOT NULL,
    account_reference TEXT, balance REAL, balance_currency_code TEXT,
    confidence REAL DEFAULT 0, raw_sms TEXT NOT NULL, sender TEXT DEFAULT '',
    sms_date INTEGER NOT NULL, created_at INTEGER NOT NULL,
    user_verified INTEGER DEFAULT 0, user_category TEXT
  )`);
  db.execute(`CREATE INDEX IF NOT EXISTS idx_date ON transactions(sms_date DESC)`);
  db.execute(`CREATE INDEX IF NOT EXISTS idx_cat ON transactions(category)`);
  db.execute(`CREATE TABLE IF NOT EXISTS sync_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_sync_ts INTEGER DEFAULT 0, total_processed INTEGER DEFAULT 0
  )`);
  db.execute(`INSERT OR IGNORE INTO sync_state(id) VALUES(1)`);

  db.execute(`CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    template TEXT NOT NULL DEFAULT 'custom',
    target_amount REAL NOT NULL,
    saved_amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    priority TEXT DEFAULT 'medium',
    is_primary INTEGER DEFAULT 0,
    icon TEXT DEFAULT 'disc',
    metadata TEXT,
    created_at INTEGER NOT NULL,
    completed_at INTEGER
  )`);

  db.execute(`CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    monthly_limit REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    category_caps TEXT,
    exclude_transfers INTEGER DEFAULT 1,
    exclude_refunds INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
  )`);
}


