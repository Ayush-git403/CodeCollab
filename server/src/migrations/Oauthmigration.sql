-- Run once against your Postgres database
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_id TEXT;

-- OAuth users have no password
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_provider_unique
  ON users (provider, provider_id)
  WHERE provider IS NOT NULL;