-- COMPLETE AUDIT LOG SYSTEM FOR ADMINS
-- Tracks every action with timestamps and user names

-- ============================================
-- 1. Create audit_log table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'event', 'member', 'role', 'organization', etc.
  entity_id UUID,
  entity_name TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_audit_log_organization ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- ============================================
-- 2. Enable RLS on audit_log
-- ============================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "admins_can_view_audit_logs"
ON audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = audit_log.organization_id
      AND om.role = 'admin'
      AND om.is_active = true
  )
);

-- Allow system to insert audit logs (no user check)
CREATE POLICY "system_can_insert_audit_logs"
ON audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON audit_log TO authenticated;

-- ============================================
-- 3. Create function to log actions
-- ============================================
CREATE OR REPLACE FUNCTION log_audit_action(
  p_organization_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_name TEXT;
  v_user_email TEXT;
  v_audit_id UUID;
BEGIN
  -- Get user details
  SELECT name, email INTO v_user_name, v_user_email
  FROM users
  WHERE id = p_user_id;
  
  -- Insert audit log
  INSERT INTO audit_log (
    organization_id,
    user_id,
    user_name,
    user_email,
    action,
    entity_type,
    entity_id,
    entity_name,
    details
  ) VALUES (
    p_organization_id,
    p_user_id,
    COALESCE(v_user_name, 'Unknown User'),
    v_user_email,
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_details
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- ============================================
-- 4. Create triggers for automatic logging
-- ============================================

-- Log event creation
CREATE OR REPLACE FUNCTION audit_event_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM log_audit_action(
    NEW.organization_id,
    NEW.created_by,
    'EVENT_CREATED',
    'event',
    NEW.id,
    NEW.title,
    jsonb_build_object(
      'date', NEW.date,
      'time', NEW.time,
      'location', NEW.location,
      'max_attendees', NEW.max_attendees,
      'allowed_roles', NEW.allowed_roles
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_audit_event_created
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION audit_event_created();

-- Log event updates
CREATE OR REPLACE FUNCTION audit_event_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_changes JSONB := '{}'::jsonb;
BEGIN
  -- Track what changed
  IF OLD.title != NEW.title THEN
    v_changes := v_changes || jsonb_build_object('title', jsonb_build_object('old', OLD.title, 'new', NEW.title));
  END IF;
  IF OLD.status != NEW.status THEN
    v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
  END IF;
  IF OLD.max_attendees != NEW.max_attendees THEN
    v_changes := v_changes || jsonb_build_object('max_attendees', jsonb_build_object('old', OLD.max_attendees, 'new', NEW.max_attendees));
  END IF;
  
  PERFORM log_audit_action(
    NEW.organization_id,
    auth.uid(),
    'EVENT_UPDATED',
    'event',
    NEW.id,
    NEW.title,
    jsonb_build_object('changes', v_changes)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_audit_event_updated
AFTER UPDATE ON events
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION audit_event_updated();

-- Log event deletion
CREATE OR REPLACE FUNCTION audit_event_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM log_audit_action(
    OLD.organization_id,
    auth.uid(),
    'EVENT_DELETED',
    'event',
    OLD.id,
    OLD.title,
    jsonb_build_object(
      'date', OLD.date,
      'signup_count', OLD.signup_count
    )
  );
  RETURN OLD;
END;
$$;

CREATE TRIGGER trigger_audit_event_deleted
BEFORE DELETE ON events
FOR EACH ROW
EXECUTE FUNCTION audit_event_deleted();

-- Log member joins
CREATE OR REPLACE FUNCTION audit_member_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_name TEXT;
  v_org_name TEXT;
BEGIN
  SELECT name INTO v_user_name FROM users WHERE id = NEW.user_id;
  SELECT name INTO v_org_name FROM organizations WHERE id = NEW.organization_id;
  
  PERFORM log_audit_action(
    NEW.organization_id,
    NEW.user_id,
    'MEMBER_JOINED',
    'member',
    NEW.id,
    v_user_name,
    jsonb_build_object(
      'role', NEW.role,
      'organization', v_org_name
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_audit_member_joined
AFTER INSERT ON organization_members
FOR EACH ROW
EXECUTE FUNCTION audit_member_joined();

-- Log member role changes
CREATE OR REPLACE FUNCTION audit_member_role_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  SELECT name INTO v_user_name FROM users WHERE id = NEW.user_id;
  
  IF OLD.role != NEW.role THEN
    PERFORM log_audit_action(
      NEW.organization_id,
      auth.uid(),
      'MEMBER_ROLE_CHANGED',
      'member',
      NEW.id,
      v_user_name,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_audit_member_role_changed
AFTER UPDATE ON organization_members
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION audit_member_role_changed();

-- Log event attendee signups
CREATE OR REPLACE FUNCTION audit_event_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_name TEXT;
  v_event_title TEXT;
  v_org_id UUID;
BEGIN
  SELECT name INTO v_user_name FROM users WHERE id = NEW.user_id;
  SELECT title, organization_id INTO v_event_title, v_org_id FROM events WHERE id = NEW.event_id;
  
  PERFORM log_audit_action(
    v_org_id,
    NEW.user_id,
    'EVENT_SIGNUP',
    'event_attendee',
    NEW.id,
    v_event_title,
    jsonb_build_object(
      'user', v_user_name,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_audit_event_signup
AFTER INSERT ON event_attendees
FOR EACH ROW
EXECUTE FUNCTION audit_event_signup();

-- Log check-ins
CREATE OR REPLACE FUNCTION audit_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_name TEXT;
  v_event_title TEXT;
  v_org_id UUID;
  v_action TEXT;
BEGIN
  SELECT name INTO v_user_name FROM users WHERE id = NEW.user_id;
  SELECT title, organization_id INTO v_event_title, v_org_id FROM events WHERE id = NEW.event_id;
  
  IF NEW.check_out_time IS NOT NULL AND (OLD.check_out_time IS NULL OR OLD.check_out_time IS DISTINCT FROM NEW.check_out_time) THEN
    v_action := 'EVENT_CHECKOUT';
  ELSE
    v_action := 'EVENT_CHECKIN';
  END IF;
  
  PERFORM log_audit_action(
    v_org_id,
    NEW.user_id,
    v_action,
    'event_checkin',
    NEW.id,
    v_event_title,
    jsonb_build_object(
      'user', v_user_name,
      'checked_in_by_admin', NEW.checked_in_by_admin,
      'check_in_time', NEW.check_in_time,
      'check_out_time', NEW.check_out_time
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_audit_checkin
AFTER INSERT OR UPDATE ON event_checkins
FOR EACH ROW
EXECUTE FUNCTION audit_checkin();

-- Log role assignments
CREATE OR REPLACE FUNCTION audit_role_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  SELECT name INTO v_user_name FROM users WHERE id = NEW.user_id;
  
  PERFORM log_audit_action(
    NEW.organization_id,
    COALESCE(NEW.assigned_by, NEW.user_id),
    'ROLE_ASSIGNED',
    'user_role',
    NEW.id,
    v_user_name,
    jsonb_build_object(
      'role', NEW.role_name,
      'assigned_by', NEW.assigned_by
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_audit_role_assigned
AFTER INSERT ON user_organization_roles
FOR EACH ROW
EXECUTE FUNCTION audit_role_assigned();

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ AUDIT LOG SYSTEM CREATED! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE 'What was created:';
  RAISE NOTICE '  - audit_log table';
  RAISE NOTICE '  - log_audit_action() function';
  RAISE NOTICE '  - Automatic triggers for:';
  RAISE NOTICE '    • Event creation, updates, deletion';
  RAISE NOTICE '    • Member joins, role changes';
  RAISE NOTICE '    • Event signups';
  RAISE NOTICE '    • Check-ins and check-outs';
  RAISE NOTICE '    • Role assignments';
  RAISE NOTICE '';
  RAISE NOTICE 'Only admins can view audit logs!';
  RAISE NOTICE '';
END $$;

