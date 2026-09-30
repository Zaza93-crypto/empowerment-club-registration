PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  area TEXT NOT NULL,
  registration_date TEXT,
  contact TEXT NOT NULL,
  phone TEXT NOT NULL,
  empowerment_type TEXT,
  amount REAL DEFAULT 0,
  activity TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  identity_number TEXT NOT NULL,
  group_id TEXT NOT NULL,
  name TEXT NOT NULL,
  nrc TEXT,
  gender TEXT NOT NULL,
  age INTEGER,
  phone TEXT,
  position TEXT DEFAULT 'Member',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_identity
ON members(identity_number COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_members_group
ON members(group_id);

CREATE INDEX IF NOT EXISTS idx_members_nrc
ON members(nrc COLLATE NOCASE);
