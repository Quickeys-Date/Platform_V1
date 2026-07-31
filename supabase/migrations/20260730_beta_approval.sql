-- Controlled V1 beta access and approval lifecycle.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN (
    'PENDING_EMAIL',
    'PENDING_APPROVAL',
    'ACTIVE',
    'REJECTED',
    'SUSPENDED',
    'DEACTIVATED'
  ));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS age_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT,
  ADD COLUMN IF NOT EXISTS application_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pax_access_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pax_access_ends_at TIMESTAMPTZ;

ALTER TABLE admin_actions DROP CONSTRAINT IF EXISTS admin_actions_action_check;
ALTER TABLE admin_actions
  ADD CONSTRAINT admin_actions_action_check
  CHECK (action IN (
    'APPROVE',
    'REJECT',
    'SUSPEND',
    'RESTORE',
    'DEACTIVATE',
    'REMOVE_PHOTO',
    'EXPORT_DATA',
    'DISMISS_REPORT',
    'REVIEW_REPORT'
  ));

CREATE INDEX IF NOT EXISTS idx_profiles_beta_status
  ON profiles(status, application_submitted_at DESC);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id, email, first_name, date_of_birth, gender, interested_in, city, state,
    photos, status, terms_accepted_at, terms_version,
    privacy_accepted_at, privacy_version
  )
  VALUES (
    NEW.id, NEW.email, '',
    COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::date, DATE '1900-01-01'),
    'Prefer not to say', '{}', '', '', '{}', 'PENDING_EMAIL',
    CASE WHEN (NEW.raw_user_meta_data->>'accepted_beta_terms')::boolean THEN NOW() END,
    'beta-v1',
    CASE WHEN (NEW.raw_user_meta_data->>'accepted_beta_terms')::boolean THEN NOW() END,
    'beta-v1'
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approval and access fields may only be changed by trusted server/admin code.
CREATE OR REPLACE FUNCTION protect_beta_access_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.age_confirmed_at IS DISTINCT FROM NEW.age_confirmed_at OR
    OLD.application_submitted_at IS DISTINCT FROM NEW.application_submitted_at OR
    OLD.reviewed_at IS DISTINCT FROM NEW.reviewed_at OR
    OLD.approved_at IS DISTINCT FROM NEW.approved_at OR
    OLD.approved_by IS DISTINCT FROM NEW.approved_by OR
    OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason OR
    OLD.activated_at IS DISTINCT FROM NEW.activated_at OR
    OLD.pax_access_started_at IS DISTINCT FROM NEW.pax_access_started_at OR
    OLD.pax_access_ends_at IS DISTINCT FROM NEW.pax_access_ends_at
  ) AND auth.role() <> 'service_role' AND NOT is_admin() THEN
    RAISE EXCEPTION 'Beta access fields can only be changed by an administrator';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_protect_beta_access ON profiles;
CREATE TRIGGER profiles_protect_beta_access
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_beta_access_fields();
