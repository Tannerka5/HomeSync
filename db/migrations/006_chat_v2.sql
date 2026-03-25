-- Chat V2 Schema Updates

ALTER TABLE conversation
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  ADD COLUMN IF NOT EXISTS requested_by_user_id INT REFERENCES app_user(user_id);

CREATE TABLE IF NOT EXISTS conversation_pin (
  user_id         INT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  conversation_id INT NOT NULL REFERENCES conversation(conversation_id) ON DELETE CASCADE,
  pinned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, conversation_id)
);

CREATE TABLE IF NOT EXISTS message_read (
  message_id INT NOT NULL REFERENCES message(message_id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  read_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

ALTER TABLE message DROP CONSTRAINT IF EXISTS message_message_type_check;
ALTER TABLE message ADD CONSTRAINT message_message_type_check
  CHECK (message_type IN ('text', 'listing_share', 'image', 'file'));
