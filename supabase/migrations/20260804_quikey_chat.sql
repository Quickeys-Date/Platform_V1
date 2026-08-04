-- Two-person QuiKey Chat invitations. Daily room credentials are never stored here.
CREATE TABLE IF NOT EXISTS video_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined', 'ended')),
  room_name TEXT,
  room_url TEXT,
  started_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_calls_conversation_created
  ON video_calls(conversation_id, created_at DESC);

ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view their video calls" ON video_calls;
CREATE POLICY "Participants can view their video calls" ON video_calls
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = video_calls.conversation_id
      AND auth.uid() IN (c.initiator_id, c.recipient_id)
  )
);

DROP POLICY IF EXISTS "Participants can create video calls" ON video_calls;
CREATE POLICY "Participants can create video calls" ON video_calls
FOR INSERT WITH CHECK (
  auth.uid() = initiated_by AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = video_calls.conversation_id
      AND c.status = 'active'
      AND auth.uid() IN (c.initiator_id, c.recipient_id)
  )
);

DROP POLICY IF EXISTS "Participants can update their video calls" ON video_calls;
CREATE POLICY "Participants can update their video calls" ON video_calls
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = video_calls.conversation_id
      AND auth.uid() IN (c.initiator_id, c.recipient_id)
  )
);
