-- BondSpace Complete Database Schema
-- Run this against your PostgreSQL database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- USERS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar TEXT,
  bio TEXT,
  love_language VARCHAR(50),
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
  is_verified BOOLEAN DEFAULT FALSE,
  otp_secret VARCHAR(100),
  current_mood VARCHAR(50),
  mood_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- COUPLES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'bonded', 'paused', 'broken')),
  mutual_passcode_hash VARCHAR(255),
  bond_name VARCHAR(100),
  anniversary_date DATE,
  connected_at TIMESTAMP,
  location_sharing_user1 BOOLEAN DEFAULT TRUE,
  location_sharing_user2 BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- ========================
-- MESSAGES TABLE (E2E Encrypted)
-- ========================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT, -- encrypted ciphertext
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'video', 'reaction', 'pinned', 'sticker')),
  media_url TEXT,
  is_encrypted BOOLEAN DEFAULT TRUE,
  nonce TEXT, -- libsodium nonce for decryption
  is_disappearing BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  is_pinned BOOLEAN DEFAULT FALSE,
  pinned_label VARCHAR(100),
  reply_to UUID REFERENCES messages(id),
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ========================
-- LOVE REACTIONS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- LOCATION LOGS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS location_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  address TEXT,
  place_name VARCHAR(255),
  battery_level INTEGER,
  is_reached_home BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ========================
-- GAMES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('quiz', 'puzzle', 'truth_dare', 'match', 'bingo', 'vote', 'story', 'prediction', 'other')),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- GAME SESSIONS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  game_state JSONB DEFAULT '{}',
  winner_id UUID REFERENCES users(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- ========================
-- POINTS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couples(id),
  amount INTEGER NOT NULL DEFAULT 0,
  love_xp INTEGER DEFAULT 0,
  couple_level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_checkin_date DATE,
  total_games_played INTEGER DEFAULT 0,
  source VARCHAR(50) CHECK (source IN ('checkin', 'game', 'chat_streak', 'activity', 'achievement')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- UNLOCKABLES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS unlockables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) CHECK (type IN ('sticker', 'frame', 'emoji', 'theme')),
  xp_required INTEGER DEFAULT 0,
  level_required INTEGER DEFAULT 1,
  asset_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_unlockables (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unlockable_id UUID REFERENCES unlockables(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, unlockable_id)
);

-- ========================
-- GALLERY TABLE
-- ========================
CREATE TABLE IF NOT EXISTS gallery_albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  template VARCHAR(50) CHECK (template IN ('first_meet', 'trips', 'food', 'random', 'custom')),
  cover_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  cloudinary_public_id TEXT,
  media_type VARCHAR(20) CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ========================
-- RELATIONSHIP TIMELINE TABLE
-- ========================
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  event_type VARCHAR(50) CHECK (event_type IN ('first_chat', 'first_photo', 'first_trip', 'milestone', 'custom')),
  label VARCHAR(150),
  description TEXT,
  media_url TEXT,
  event_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- DIGITAL LOVE LETTERS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS love_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user UUID NOT NULL REFERENCES users(id),
  to_user UUID NOT NULL REFERENCES users(id),
  couple_id UUID REFERENCES couples(id),
  content TEXT NOT NULL, -- encrypted
  is_encrypted BOOLEAN DEFAULT TRUE,
  open_trigger VARCHAR(50) CHECK (open_trigger IN ('anniversary', 'birthday', 'date', 'custom')),
  open_at TIMESTAMP NOT NULL,
  is_opened BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- RELATIONSHIP HEALTH SCORES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS health_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  communication_score INTEGER DEFAULT 50 CHECK (communication_score BETWEEN 0 AND 100),
  interaction_score INTEGER DEFAULT 50 CHECK (interaction_score BETWEEN 0 AND 100),
  activity_score INTEGER DEFAULT 50 CHECK (activity_score BETWEEN 0 AND 100),
  trust_meter INTEGER DEFAULT 50 CHECK (trust_meter BETWEEN 0 AND 100),
  bond_strength INTEGER DEFAULT 50 CHECK (bond_strength BETWEEN 0 AND 100),
  ai_insight TEXT,
  calculated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- COUPLE GOALS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS couple_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(30) CHECK (type IN ('travel', 'savings', 'fitness', 'custom')),
  target_value DECIMAL(15,2),
  current_value DECIMAL(15,2) DEFAULT 0,
  unit VARCHAR(50),
  target_date DATE,
  is_achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- COMMUNITIES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('coding_couples', 'long_distance', 'marriage_planning', 'friendship', 'other')),
  cover_url TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ========================
-- AI GURU CHAT TABLE
-- ========================
CREATE TABLE IF NOT EXISTS ai_guru_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(10) CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- NOTIFICATIONS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200),
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- SEED: Default Games
-- ========================
INSERT INTO games (name, type, description) VALUES
  ('Who Knows Me Better', 'quiz', 'Answer questions about your partner and see who scores higher'),
  ('Rapid Questions', 'quiz', 'Quick-fire questions to test how well you know each other'),
  ('Memory Match', 'match', 'Match shared memories and photos as a couple'),
  ('Truth or Dare', 'truth_dare', 'Relationship-themed truth or dare game'),
  ('Guess the Emoji', 'quiz', 'Partner sends emoji clues, you guess the word'),
  ('This or That', 'vote', 'Choose between two options and see if partner agrees'),
  ('Future Planning Quiz', 'quiz', 'Plan your future together with fun scenarios'),
  ('Compatibility Test', 'quiz', 'Discover your compatibility through curated questions'),
  ('Love Language Quiz', 'quiz', 'Find out each other''s love language'),
  ('Mood Guessing Game', 'quiz', 'Guess your partner''s current mood'),
  ('Story Builder', 'story', 'Build a creative story together, one line at a time'),
  ('Couple Puzzle', 'puzzle', 'Solve relationship puzzles together'),
  ('Love Bingo', 'bingo', 'Bingo with romantic & couple-themed prompts'),
  ('Personality Challenge', 'quiz', 'Deep personality questions to know each other better'),
  ('Daily Question', 'quiz', 'One thoughtful question per day for both partners'),
  ('Random Confession', 'other', 'Share a random confession with your partner'),
  ('Photo Guess', 'match', 'Guess the memory from shared couple photos'),
  ('Secret Vote', 'vote', 'Vote secretly and reveal results together'),
  ('Predict Partner', 'prediction', 'Predict how your partner will answer questions'),
  ('Couple Trivia', 'quiz', 'Trivia about your relationship milestones')
ON CONFLICT DO NOTHING;

-- ========================
-- SEED: Default Communities
-- ========================
INSERT INTO communities (name, slug, description, category) VALUES
  ('Coding Couples', 'coding-couples', 'For tech-savvy couples who code together', 'coding_couples'),
  ('Long Distance Love', 'long-distance', 'Support group for long distance relationships', 'long_distance'),
  ('Marriage Planning', 'marriage-planning', 'Planning a wedding? Share ideas and advice here', 'marriage_planning'),
  ('Friendship Circle', 'friendship-circle', 'Close friends building strong bonds', 'friendship')
ON CONFLICT DO NOTHING;

-- ========================
-- DEFAULT UNLOCKABLES
-- ========================
INSERT INTO unlockables (name, type, xp_required, level_required) VALUES
  ('Heart Burst Sticker', 'sticker', 100, 1),
  ('Golden Couple Frame', 'frame', 500, 5),
  ('Rose Theme', 'theme', 200, 2),
  ('Midnight Purple Theme', 'theme', 300, 3),
  ('Custom Love Emoji Pack', 'emoji', 1000, 10),
  ('Diamond Bond Frame', 'frame', 2000, 15),
  ('Starlight Theme', 'theme', 800, 8)
ON CONFLICT DO NOTHING;
