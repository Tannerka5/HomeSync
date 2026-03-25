-- 1. Create conversation_deleted table
CREATE TABLE IF NOT EXISTS conversation_deleted (
  user_id         INT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  conversation_id INT NOT NULL REFERENCES conversation(conversation_id) ON DELETE CASCADE,
  deleted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, conversation_id)
);

-- 2. Add new user columns to conversation
ALTER TABLE conversation ADD COLUMN IF NOT EXISTS user1_id INT REFERENCES app_user(user_id) ON DELETE SET NULL;
ALTER TABLE conversation ADD COLUMN IF NOT EXISTS user2_id INT REFERENCES app_user(user_id) ON DELETE SET NULL;

-- 3. Migrate existing data from buyer_id and realtor_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversation' AND column_name='buyer_id') THEN
    EXECUTE '
      UPDATE conversation c
      SET user1_id = b.user_id, user2_id = r.user_id
      FROM buyer b, realtor r
      WHERE c.buyer_id = b.buyer_id AND c.realtor_id = r.realtor_id;
    ';
    
    -- 4. Drop old columns
    ALTER TABLE conversation DROP COLUMN buyer_id;
    ALTER TABLE conversation DROP COLUMN realtor_id;
  END IF;
END $$;

-- 5. Add new indexes
CREATE INDEX IF NOT EXISTS idx_conversation_user1 ON conversation(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversation_user2 ON conversation(user2_id);
