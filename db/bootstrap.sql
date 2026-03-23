-- HomeSync non-destructive bootstrap data for deployed environments.
-- Safe to run repeatedly. Inserts demo records only when the database is empty.

INSERT INTO app_user (first_name, last_name, email, password_hash, user_type, is_active)
SELECT
  'Alex',
  'Buyer',
  'alex.buyer@homesync.local',
  '$2b$12$faiFjYvD3kRBUxYjI3W2y.ka7tQcJ9q39lJ4Z2JDtSIBs6wSPZWaS',
  'buyer',
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM app_user WHERE email = 'alex.buyer@homesync.local'
);

INSERT INTO app_user (first_name, last_name, email, password_hash, user_type, is_active)
SELECT
  'Sarah',
  'Realtor',
  'sarah.realtor@homesync.local',
  '$2b$12$faiFjYvD3kRBUxYjI3W2y.ka7tQcJ9q39lJ4Z2JDtSIBs6wSPZWaS',
  'realtor',
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM app_user WHERE email = 'sarah.realtor@homesync.local'
);

INSERT INTO app_user (first_name, last_name, email, password_hash, user_type, is_active)
SELECT
  'Michael',
  'Lender',
  'michael.lender@homesync.local',
  '$2b$12$faiFjYvD3kRBUxYjI3W2y.ka7tQcJ9q39lJ4Z2JDtSIBs6wSPZWaS',
  'collaborator',
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM app_user WHERE email = 'michael.lender@homesync.local'
);

INSERT INTO buyer (user_id, phone, budget_min, budget_max, preapproved, preferred_city)
SELECT u.user_id, '801-555-0101', 500000, 900000, TRUE, 'Riverdale'
FROM app_user u
WHERE u.email = 'alex.buyer@homesync.local'
  AND NOT EXISTS (
    SELECT 1 FROM buyer b WHERE b.user_id = u.user_id
  );

INSERT INTO realtor (user_id, phone, brokerage_name, license_number, service_area, years_experience)
SELECT u.user_id, '801-555-0202', 'Summit Realty Group', 'UT-RE-100200', 'Salt Lake County', 9
FROM app_user u
WHERE u.email = 'sarah.realtor@homesync.local'
  AND NOT EXISTS (
    SELECT 1 FROM realtor r WHERE r.user_id = u.user_id
  );

INSERT INTO listing (address_line1, city, state, zip, price, beds, baths, sqft, description, image, status, created_by_user_id)
SELECT '123 Maple Avenue', 'Riverdale', 'UT', '84067', 850000, 4, 3, 2500, 'Beautiful suburban home with a large backyard and renovated kitchen.', '/images/listing-1.jpg', 'active', u.user_id
FROM app_user u
WHERE u.email = 'sarah.realtor@homesync.local'
  AND NOT EXISTS (
    SELECT 1 FROM listing WHERE address_line1 = '123 Maple Avenue' AND city = 'Riverdale'
  );

INSERT INTO listing (address_line1, city, state, zip, price, beds, baths, sqft, description, image, status, created_by_user_id)
SELECT '456 Main Street Unit 4B', 'Salt Lake City', 'UT', '84101', 625000, 2, 2, 1200, 'Industrial chic loft in the heart of the city with floor-to-ceiling windows.', '/images/listing-2.jpg', 'new', u.user_id
FROM app_user u
WHERE u.email = 'sarah.realtor@homesync.local'
  AND NOT EXISTS (
    SELECT 1 FROM listing WHERE address_line1 = '456 Main Street Unit 4B' AND city = 'Salt Lake City'
  );

INSERT INTO listing (address_line1, city, state, zip, price, beds, baths, sqft, description, image, status, created_by_user_id)
SELECT '789 Oak Lane', 'Green Valley', 'UT', '84095', 550000, 3, 2, 1800, 'Charming craftsman style home with original details and a covered porch.', '/images/listing-3.jpg', 'pending', u.user_id
FROM app_user u
WHERE u.email = 'sarah.realtor@homesync.local'
  AND NOT EXISTS (
    SELECT 1 FROM listing WHERE address_line1 = '789 Oak Lane' AND city = 'Green Valley'
  );

INSERT INTO listing (address_line1, city, state, zip, price, beds, baths, sqft, description, image, status, created_by_user_id)
SELECT '321 Lakeview Dr', 'Harbor Point', 'UT', '84074', 1200000, 5, 4, 3500, 'Stunning waterfront property with private dock and panoramic views.', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', 'active', u.user_id
FROM app_user u
WHERE u.email = 'sarah.realtor@homesync.local'
  AND NOT EXISTS (
    SELECT 1 FROM listing WHERE address_line1 = '321 Lakeview Dr' AND city = 'Harbor Point'
  );
