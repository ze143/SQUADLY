-- =========================================================
-- Football Management System - Database Schema
-- =========================================================

-- ===== الامتدادات =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1) users
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'team_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =========================================================
-- 2) teams
-- =========================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  birth_year INT NOT NULL,
  age_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_birth_year ON teams(birth_year);

-- =========================================================
-- 3) user_teams (many-to-many)
-- =========================================================
CREATE TABLE IF NOT EXISTS user_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_user_teams_user ON user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_team ON user_teams(team_id);

-- =========================================================
-- 4) players
-- =========================================================
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  national_id TEXT UNIQUE NOT NULL,
  birth_date DATE NOT NULL,
  birth_year INT NOT NULL,
  position TEXT NOT NULL CHECK (position IN
    ('GK','CB','LB','RB','DM','CM','AM','LW','RW','ST')),
  previous_clubs TEXT,
  technical_level TEXT,
  player_type TEXT CHECK (player_type IN ('free', 'investment')) DEFAULT 'free',
  payment_type TEXT CHECK (payment_type IN ('full', 'partial', 'installments')),
  total_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('paid','unpaid','pending')) DEFAULT 'pending',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_national_id ON players(national_id);
CREATE INDEX IF NOT EXISTS idx_players_birth_year ON players(birth_year);

-- =========================================================
-- 5) competitions
-- =========================================================
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  season TEXT NOT NULL,
  type TEXT CHECK (type IN ('league','cup','regional')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- 6) matches
-- =========================================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
  opponent TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  status TEXT CHECK (status IN ('scheduled','in_progress','closed'))
    DEFAULT 'scheduled',
  technical_report TEXT,
  admin_report TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_team ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- =========================================================
-- 7) match_lineups
-- =========================================================
CREATE TABLE IF NOT EXISTS match_lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  lineup_type TEXT NOT NULL CHECK (lineup_type IN ('starter','substitute')),
  jersey_number INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_lineups_match ON match_lineups(match_id);

-- =========================================================
-- 8) match_events
-- =========================================================
CREATE TABLE IF NOT EXISTS match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  assist_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN
    ('goal','assist','yellow_card','red_card','substitution_in','substitution_out')),
  minute INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_events_player ON match_events(player_id);

-- =========================================================
-- 9) match_referees
-- =========================================================
CREATE TABLE IF NOT EXISTS match_referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  referee_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('main','assistant1','assistant2','fourth')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referees_match ON match_referees(match_id);

-- =========================================================
-- 10) installments
-- =========================================================
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT CHECK (status IN ('paid','unpaid','pending')) DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installments_player ON installments(player_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due ON installments(due_date);

-- =========================================================
-- 11) escalation_requests
-- =========================================================
CREATE TABLE IF NOT EXISTS escalation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  from_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  to_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  reason TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalation_requests(status);
CREATE INDEX IF NOT EXISTS idx_escalations_player ON escalation_requests(player_id);

-- =========================================================
-- Row Level Security
-- =========================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_referees ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_requests ENABLE ROW LEVEL SECURITY;

-- ===== Helper functions =====
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===== users policies =====
DROP POLICY IF EXISTS "users_self_read" ON users;
CREATE POLICY "users_self_read" ON users
  FOR SELECT USING (auth_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "users_admin_all" ON users;
CREATE POLICY "users_admin_all" ON users
  FOR ALL USING (is_admin());

-- ===== teams policies =====
DROP POLICY IF EXISTS "teams_read_authenticated" ON teams;
CREATE POLICY "teams_read_authenticated" ON teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "teams_admin_write" ON teams;
CREATE POLICY "teams_admin_write" ON teams
  FOR ALL USING (is_admin());

-- ===== user_teams policies =====
DROP POLICY IF EXISTS "user_teams_admin_all" ON user_teams;
CREATE POLICY "user_teams_admin_all" ON user_teams
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "user_teams_self_read" ON user_teams;
CREATE POLICY "user_teams_self_read" ON user_teams
  FOR SELECT USING (user_id = current_user_id());

-- ===== players policies =====
DROP POLICY IF EXISTS "players_admin_all" ON players;
CREATE POLICY "players_admin_all" ON players
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "players_team_admin" ON players;
CREATE POLICY "players_team_admin" ON players
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = current_user_id()
    )
  );

-- ===== matches policies =====
DROP POLICY IF EXISTS "matches_admin_all" ON matches;
CREATE POLICY "matches_admin_all" ON matches
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "matches_team_admin" ON matches;
CREATE POLICY "matches_team_admin" ON matches
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = current_user_id()
    )
  );

-- ===== installments policies =====
DROP POLICY IF EXISTS "installments_admin_all" ON installments;
CREATE POLICY "installments_admin_all" ON installments
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "installments_team_admin" ON installments;
CREATE POLICY "installments_team_admin" ON installments
  FOR ALL USING (
    player_id IN (
      SELECT id FROM players
      WHERE team_id IN (
        SELECT team_id FROM user_teams WHERE user_id = current_user_id()
      )
    )
  );

-- ===== escalation_requests policies =====
DROP POLICY IF EXISTS "escalations_admin_all" ON escalation_requests;
CREATE POLICY "escalations_admin_all" ON escalation_requests
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "escalations_team_admin" ON escalation_requests;
CREATE POLICY "escalations_team_admin" ON escalation_requests
  FOR ALL USING (
    from_team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = current_user_id()
    )
    OR to_team_id IN (
      SELECT team_id FROM user_teams WHERE user_id = current_user_id()
    )
    OR requested_by = current_user_id()
  );

-- ===== match_lineups policies =====
DROP POLICY IF EXISTS "lineups_auth_read" ON match_lineups;
CREATE POLICY "lineups_auth_read" ON match_lineups
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "lineups_admin_write" ON match_lineups;
CREATE POLICY "lineups_admin_write" ON match_lineups
  FOR ALL USING (
    is_admin() OR
    match_id IN (
      SELECT id FROM matches WHERE team_id IN (
        SELECT team_id FROM user_teams WHERE user_id = current_user_id()
      )
    )
  );

-- ===== match_events policies =====
DROP POLICY IF EXISTS "events_auth_read" ON match_events;
CREATE POLICY "events_auth_read" ON match_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "events_admin_write" ON match_events;
CREATE POLICY "events_admin_write" ON match_events
  FOR ALL USING (
    is_admin() OR
    match_id IN (
      SELECT id FROM matches WHERE team_id IN (
        SELECT team_id FROM user_teams WHERE user_id = current_user_id()
      )
    )
  );

-- ===== match_referees policies =====
DROP POLICY IF EXISTS "referees_auth_read" ON match_referees;
CREATE POLICY "referees_auth_read" ON match_referees
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "referees_admin_write" ON match_referees;
CREATE POLICY "referees_admin_write" ON match_referees
  FOR ALL USING (
    is_admin() OR
    match_id IN (
      SELECT id FROM matches WHERE team_id IN (
        SELECT team_id FROM user_teams WHERE user_id = current_user_id()
      )
    )
  );

-- ===== competitions policies =====
DROP POLICY IF EXISTS "competitions_auth_read" ON competitions;
CREATE POLICY "competitions_auth_read" ON competitions
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "competitions_admin_write" ON competitions;
CREATE POLICY "competitions_admin_write" ON competitions
  FOR ALL USING (is_admin());

-- =========================================================
-- انتهى
-- =========================================================