-- Run once against the EXISTING empowerment-registration-db D1 database.
-- Do not recreate groups or members. This only adds admin tables.
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('primary','data_officer','viewer')),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
