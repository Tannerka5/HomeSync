-- Support structured chat message payloads (e.g., listing shares).

ALTER TABLE message
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(40) NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS message_payload JSONB;

ALTER TABLE message
  DROP CONSTRAINT IF EXISTS message_message_type_check;

ALTER TABLE message
  ADD CONSTRAINT message_message_type_check
  CHECK (message_type IN ('text', 'listing_share'));
