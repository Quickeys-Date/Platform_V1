-- ============================================================
-- QuicKeys™ V1 — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL CHECK (char_length(first_name) <= 30),
  date_of_birth DATE NOT NULL,
  age INTEGER GENERATED ALWAYS AS (DATE_PART('year', AGE(date_of_birth))::INTEGER) STORED,
  gender TEXT NOT NULL CHECK (gender IN ('Man', 'Woman', 'Non-binary', 'Prefer not to say')),
  interested_in TEXT[] NOT NULL DEFAULT '{}',
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  bio TEXT CHECK (char_length(bio) <= 250),
  connection_prompt TEXT CHECK (char_length(connection_prompt) <= 150),
  age_range_min INTEGER NOT NULL DEFAULT 18,
  age_range_max INTEGER NOT NULL DEFAULT 45,
  location_radius TEXT NOT NULL DEFAULT '25mi' CHECK (location_radius IN ('25mi', '50mi', '100mi', 'Anywhere')),
  photos TEXT[] NOT NULL DEFAULT '{}' CHECK (array_length(photos, 1) <= 3),
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
  pax_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES profiles(id),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(initiator_id, recipient_id)
);

CREATE INDEX idx_conversations_initiator ON conversations(initiator_id);
CREATE INDEX idx_conversations_recipient ON conversations(recipient_id);
CREATE INDEX idx_conversations_status ON conversations(status);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ============================================================
-- PAX TRIGGERS
-- ============================================================
CREATE TABLE IF NOT EXISTS pax_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('CLOSE_CONVERSATION', 'INACTIVITY')),
  state_id_selected TEXT CHECK (state_id_selected IN ('PAX_GOOD','PAX_NEUTRAL','PAX_NOT_GREAT','PAX_CONFUSED','PAX_DISAPPOINTED')),
  feedback_response TEXT CHECK (feedback_response IN ('FEEDBACK_YES', 'FEEDBACK_NOT_QUITE')),
  feedback_open_text TEXT CHECK (char_length(feedback_open_text) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pax_user ON pax_triggers(user_id);
CREATE INDEX idx_pax_conversation ON pax_triggers(conversation_id);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('REPORT_INAPPROPRIATE','REPORT_HARASSMENT','REPORT_SPAM','REPORT_FAKE','REPORT_OTHER')),
  note TEXT CHECK (char_length(note) <= 300),
  source_screen TEXT NOT NULL CHECK (source_screen IN ('Chat', 'Connection Profile')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_reported ON reports(reported_id);
CREATE INDEX idx_reports_status ON reports(status);

-- ============================================================
-- ADMIN ACTIONS LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('SUSPEND', 'RESTORE', 'DEACTIVATE', 'REMOVE_PHOTO', 'EXPORT_DATA', 'DISMISS_REPORT', 'REVIEW_REPORT')),
  target_user_id UUID REFERENCES profiles(id),
  target_report_id UUID REFERENCES reports(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update conversation last_message_at when message inserted
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pax_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Helper: is current user admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "Users can view non-deactivated profiles"
  ON profiles FOR SELECT
  USING (status != 'DEACTIVATED' OR id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = 'USER'); -- can't self-promote to ADMIN

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin());

-- CONVERSATIONS policies
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (initiator_id = auth.uid() OR recipient_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert conversations"
  ON conversations FOR INSERT
  WITH CHECK (initiator_id = auth.uid());

CREATE POLICY "Participants can update conversation"
  ON conversations FOR UPDATE
  USING (initiator_id = auth.uid() OR recipient_id = auth.uid() OR is_admin());

-- MESSAGES policies
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.initiator_id = auth.uid() OR c.recipient_id = auth.uid())
    ) OR is_admin()
  );

CREATE POLICY "Participants can insert messages in active conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.initiator_id = auth.uid() OR c.recipient_id = auth.uid())
        AND c.status = 'active'
    )
  );

-- PAX TRIGGERS policies
CREATE POLICY "Users can view own pax triggers"
  ON pax_triggers FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert own pax triggers"
  ON pax_triggers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pax triggers (for feedback)"
  ON pax_triggers FOR UPDATE
  USING (user_id = auth.uid());

-- REPORTS policies
CREATE POLICY "Users can insert reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (is_admin());

-- ADMIN ACTIONS policies
CREATE POLICY "Admins can insert actions"
  ON admin_actions FOR INSERT
  WITH CHECK (is_admin() AND admin_id = auth.uid());

CREATE POLICY "Admins can view actions"
  ON admin_actions FOR SELECT
  USING (is_admin());

-- ============================================================
-- REALTIME
-- Enable realtime for messages and conversations
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ============================================================
-- STORAGE BUCKET (run separately or via dashboard)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', false);
-- CREATE POLICY "Users can upload own photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can view photos in conversations" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
-- CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Admins can delete any photo" ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND is_admin());

-- ============================================================
-- USAGE EVENTS (login timestamps, screen views, session duration)
-- Per spec: "Usage events: Login timestamps, screen views, session duration"
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('LOGIN', 'SCREEN_VIEW', 'SESSION_END')),
  screen TEXT,                        -- screen name for SCREEN_VIEW events
  session_duration_seconds INTEGER,   -- for SESSION_END events
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_events_user ON usage_events(user_id);
CREATE INDEX idx_usage_events_type ON usage_events(event_type);
CREATE INDEX idx_usage_events_created ON usage_events(created_at);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own usage events"
  ON usage_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all usage events"
  ON usage_events FOR SELECT
  USING (is_admin());
