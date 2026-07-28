CREATE TABLE IF NOT EXISTS resource_listings (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('official', 'third-party')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('card-pack', 'community')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  author TEXT NOT NULL,
  package_key TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  item_count INTEGER NOT NULL CHECK (item_count >= 0),
  content_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (resource_type, package_key)
);

CREATE INDEX IF NOT EXISTS resource_listings_public_idx
  ON resource_listings (status, source, updated_at DESC);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip_hash TEXT PRIMARY KEY,
  failures INTEGER NOT NULL,
  window_started_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS login_attempts_updated_idx ON login_attempts (updated_at);
