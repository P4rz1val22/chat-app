-- Chat App Database Schema (Final)
-- Tested and working with NextAuth v4 + Google OAuth

-- NextAuth required tables (with correct column names)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image VARCHAR(255),
  username VARCHAR(50) UNIQUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastSeen" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "sessionToken" VARCHAR(100) UNIQUE NOT NULL,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Chat application tables
CREATE TYPE room_type AS ENUM ('dm', 'group', 'public_channel');
CREATE TYPE member_role AS ENUM ('member', 'admin', 'owner');

CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type room_type NOT NULL DEFAULT 'group',
  created_by INTEGER NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_members (
  room_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role member_role NOT NULL DEFAULT 'member',
  added_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by INTEGER NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  attachment_url VARCHAR(500),
  attachment_type VARCHAR(50),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

-- Foreign key constraints
ALTER TABLE accounts ADD CONSTRAINT fk_accounts_user 
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user 
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE rooms ADD CONSTRAINT fk_rooms_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE room_members ADD CONSTRAINT fk_room_members_room 
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

ALTER TABLE room_members ADD CONSTRAINT fk_room_members_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE room_members ADD CONSTRAINT fk_room_members_added_by 
  FOREIGN KEY (added_by) REFERENCES users(id);

ALTER TABLE messages ADD CONSTRAINT fk_messages_room 
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT fk_messages_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions("sessionToken");
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts("userId");
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider, "providerAccountId");
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users("lastSeen");

-- Comments
COMMENT ON TABLE rooms IS 'All chat conversations - DMs, groups, and public channels';
COMMENT ON TABLE room_members IS 'Junction table for room membership with roles';
COMMENT ON TABLE messages IS 'All chat messages with optional file attachments';
COMMENT ON COLUMN rooms.name IS 'Auto-generated for DMs (John, Sarah) or custom for groups';
COMMENT ON COLUMN room_members.added_by IS 'References user who added this member (self for creators)';
COMMENT ON COLUMN messages.edited_at IS 'NULL for unedited messages, timestamp for edited ones';