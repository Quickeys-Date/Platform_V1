CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL DEFAULT 'STANDARD' CHECK (request_type IN ('STANDARD', 'QUIKEY')),
  prompt_question TEXT CHECK (char_length(prompt_question) <= 180),
  prompt_answer TEXT CHECK (char_length(prompt_answer) <= 300),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (sender_id <> recipient_id),
  CHECK (request_type = 'STANDARD' OR (prompt_question IS NOT NULL AND prompt_answer IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_connection_requests_one_pending
  ON connection_requests(sender_id, recipient_id) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_connection_requests_recipient_status ON connection_requests(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_sender_status ON connection_requests(sender_id, status);

ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view connection requests" ON connection_requests;
CREATE POLICY "Participants can view connection requests" ON connection_requests FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can send connection requests" ON connection_requests;
CREATE POLICY "Users can send connection requests" ON connection_requests FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND recipient_id <> auth.uid());

DROP POLICY IF EXISTS "Recipients can respond to requests" ON connection_requests;
CREATE POLICY "Recipients can respond to requests" ON connection_requests FOR UPDATE
  USING (recipient_id = auth.uid() OR (sender_id = auth.uid() AND status = 'PENDING') OR is_admin());
