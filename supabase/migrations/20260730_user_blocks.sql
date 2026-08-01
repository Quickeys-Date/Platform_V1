CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own blocks" ON user_blocks;
CREATE POLICY "Users can view own blocks" ON user_blocks FOR SELECT
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Users can block profiles" ON user_blocks;
CREATE POLICY "Users can block profiles" ON user_blocks FOR INSERT
  WITH CHECK (blocker_id = auth.uid() AND blocked_id <> auth.uid());
DROP POLICY IF EXISTS "Users can remove own blocks" ON user_blocks;
CREATE POLICY "Users can remove own blocks" ON user_blocks FOR DELETE
  USING (blocker_id = auth.uid() OR is_admin());
