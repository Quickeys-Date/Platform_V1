-- Preserve every Pax feedback entry and allow the development team to track
-- whether an item still needs work or has already been addressed.
ALTER TABLE pax_triggers
  ADD COLUMN IF NOT EXISTS feedback_status TEXT NOT NULL DEFAULT 'OPEN',
  ADD COLUMN IF NOT EXISTS feedback_addressed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feedback_addressed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE pax_triggers DROP CONSTRAINT IF EXISTS pax_triggers_feedback_status_check;
ALTER TABLE pax_triggers
  ADD CONSTRAINT pax_triggers_feedback_status_check
  CHECK (feedback_status IN ('OPEN', 'ADDRESSED'));

CREATE INDEX IF NOT EXISTS idx_pax_feedback_status_created
  ON pax_triggers(feedback_status, created_at DESC)
  WHERE feedback_open_text IS NOT NULL;

ALTER TABLE admin_actions DROP CONSTRAINT IF EXISTS admin_actions_action_check;
ALTER TABLE admin_actions
  ADD CONSTRAINT admin_actions_action_check CHECK (action IN (
    'APPROVE', 'REJECT', 'SUSPEND', 'RESTORE', 'DEACTIVATE',
    'REMOVE_PHOTO', 'EXPORT_DATA', 'DISMISS_REPORT', 'REVIEW_REPORT',
    'ADDRESS_FEEDBACK', 'REOPEN_FEEDBACK'
  ));
