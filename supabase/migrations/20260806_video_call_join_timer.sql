-- Start the two-minute limit only after both participants have joined the
-- provider call. Permission prompts and connection setup are never timed.
ALTER TABLE video_calls
  ADD COLUMN IF NOT EXISTS initiator_joined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recipient_joined_at TIMESTAMPTZ;
