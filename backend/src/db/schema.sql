CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE rooms (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  target_output TEXT,
  target_type TEXT DEFAULT 'terminal',
  language    TEXT DEFAULT 'python',
  time_limit  INTEGER DEFAULT 300,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  username    TEXT NOT NULL,
  room_id     TEXT REFERENCES rooms(id),
  joined_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE submissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     TEXT REFERENCES rooms(id),
  user_id     TEXT,
  username    TEXT,
  code        TEXT NOT NULL,
  output      TEXT,
  matched     BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE files (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     TEXT REFERENCES rooms(id),
  filename    TEXT NOT NULL,
  language    TEXT,
  content     TEXT,
  saved_by    TEXT,
  saved_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_memory (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT NOT NULL,
  room_id     TEXT,
  memory_type TEXT,
  content     TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);