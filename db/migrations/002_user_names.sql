ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

UPDATE app_user
SET first_name = COALESCE(NULLIF(first_name, ''), 'HomeSync')
WHERE first_name IS NULL OR first_name = '';

UPDATE app_user
SET last_name = COALESCE(NULLIF(last_name, ''), 'User')
WHERE last_name IS NULL OR last_name = '';

ALTER TABLE app_user
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;
