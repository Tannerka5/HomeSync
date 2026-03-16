-- HomeSync schema generated from ERD
-- Run this file after creating the database.

CREATE TABLE IF NOT EXISTS app_user (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('buyer', 'realtor', 'collaborator')),
  token_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS buyer (
  buyer_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES app_user(user_id) ON DELETE CASCADE,
  phone VARCHAR(25),
  budget_min NUMERIC(12, 2),
  budget_max NUMERIC(12, 2),
  preapproved BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_city VARCHAR(120)
);

CREATE TABLE IF NOT EXISTS realtor (
  realtor_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES app_user(user_id) ON DELETE CASCADE,
  phone VARCHAR(25),
  brokerage_name VARCHAR(120),
  license_number VARCHAR(80) UNIQUE,
  service_area VARCHAR(160),
  years_experience INT
);

CREATE TABLE IF NOT EXISTS listing (
  listing_id SERIAL PRIMARY KEY,
  address_line1 VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip VARCHAR(10) NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  beds INT DEFAULT 0,
  baths INT DEFAULT 0,
  sqft INT DEFAULT 0,
  description TEXT,
  image VARCHAR(500),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'new', 'pending', 'sold', 'off_market')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_user_id INT REFERENCES app_user(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS listing_assignment (
  assignment_id SERIAL PRIMARY KEY,
  listing_id INT NOT NULL REFERENCES listing(listing_id) ON DELETE CASCADE,
  buyer_id INT NOT NULL REFERENCES buyer(buyer_id) ON DELETE CASCADE,
  realtor_id INT NOT NULL REFERENCES realtor(realtor_id) ON DELETE CASCADE,
  assignment_role VARCHAR(80) NOT NULL CHECK (assignment_role IN ('lead_realtor', 'co_realtor', 'buyer_agent')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, buyer_id, realtor_id)
);

CREATE TABLE IF NOT EXISTS conversation (
  conversation_id SERIAL PRIMARY KEY,
  listing_id INT REFERENCES listing(listing_id) ON DELETE SET NULL,
  buyer_id INT REFERENCES buyer(buyer_id) ON DELETE SET NULL,
  realtor_id INT REFERENCES realtor(realtor_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS collab_item (
  collab_item_id SERIAL PRIMARY KEY,
  listing_id INT REFERENCES listing(listing_id) ON DELETE CASCADE,
  created_by_user_id INT REFERENCES app_user(user_id) ON DELETE SET NULL,
  item_type VARCHAR(40) NOT NULL CHECK (item_type IN ('task', 'note', 'document')),
  title VARCHAR(255) NOT NULL,
  body_text TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message (
  message_id SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL REFERENCES conversation(conversation_id) ON DELETE CASCADE,
  sender_user_id INT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_user_email ON app_user(email);
CREATE INDEX IF NOT EXISTS idx_listing_city_state ON listing(city, state);
CREATE INDEX IF NOT EXISTS idx_listing_status ON listing(status);
CREATE INDEX IF NOT EXISTS idx_listing_created_by ON listing(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_collab_item_listing ON collab_item(listing_id);
CREATE INDEX IF NOT EXISTS idx_collab_item_type ON collab_item(item_type);
CREATE INDEX IF NOT EXISTS idx_collab_item_created_by ON collab_item(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_message_conversation ON message(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_buyer ON conversation(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversation_realtor ON conversation(realtor_id);
