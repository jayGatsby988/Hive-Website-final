-- Function to update event signup_count automatically
CREATE OR REPLACE FUNCTION update_event_signup_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment signup_count when a new attendee is added
    UPDATE events
    SET signup_count = COALESCE(signup_count, 0) + 1
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement signup_count when an attendee is removed
    UPDATE events
    SET signup_count = GREATEST(COALESCE(signup_count, 0) - 1, 0)
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS event_attendees_signup_count_trigger ON event_attendees;

-- Create trigger on event_attendees table
CREATE TRIGGER event_attendees_signup_count_trigger
AFTER INSERT OR DELETE ON event_attendees
FOR EACH ROW
EXECUTE FUNCTION update_event_signup_count();

-- Initialize signup_count for existing events
UPDATE events
SET signup_count = (
  SELECT COUNT(*)
  FROM event_attendees
  WHERE event_attendees.event_id = events.id
)
WHERE signup_count IS NULL OR signup_count = 0;

-- Set default values for events with null capacity
UPDATE events
SET max_attendees = 100
WHERE max_attendees IS NULL OR max_attendees = 0;

UPDATE events
SET signup_count = 0
WHERE signup_count IS NULL;

