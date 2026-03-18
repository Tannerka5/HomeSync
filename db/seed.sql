-- HomeSync sample seed data
-- Assumes db/schema.sql has already been executed.
-- All demo users have password: password123
-- Attempt Fix to Bad Gateway

TRUNCATE TABLE
  message,
  conversation,
  listing_assignment,
  collab_item,
  listing,
  realtor,
  buyer,
  app_user
RESTART IDENTITY CASCADE;

INSERT INTO app_user (first_name, last_name, email, password_hash, user_type, is_active)
VALUES
  ('Alex', 'Buyer', 'alex.buyer@homesync.local', '$2b$12$faiFjYvD3kRBUxYjI3W2y.ka7tQcJ9q39lJ4Z2JDtSIBs6wSPZWaS', 'buyer', TRUE),
  ('Sarah', 'Realtor', 'sarah.realtor@homesync.local', '$2b$12$faiFjYvD3kRBUxYjI3W2y.ka7tQcJ9q39lJ4Z2JDtSIBs6wSPZWaS', 'realtor', TRUE),
  ('Michael', 'Lender', 'michael.lender@homesync.local', '$2b$12$faiFjYvD3kRBUxYjI3W2y.ka7tQcJ9q39lJ4Z2JDtSIBs6wSPZWaS', 'collaborator', TRUE);

INSERT INTO buyer (user_id, phone, budget_min, budget_max, preapproved, preferred_city)
VALUES
  (1, '801-555-0101', 500000, 900000, TRUE, 'Riverdale');

INSERT INTO realtor (user_id, phone, brokerage_name, license_number, service_area, years_experience)
VALUES
  (2, '801-555-0202', 'Summit Realty Group', 'UT-RE-100200', 'Salt Lake County', 9);

INSERT INTO listing (address_line1, city, state, zip, price, beds, baths, sqft, description, image, status, created_by_user_id)
VALUES
  ('123 Maple Avenue', 'Riverdale', 'UT', '84067', 850000, 4, 3, 2500, 'Beautiful suburban home with a large backyard and renovated kitchen.', '/images/listing-1.jpg', 'active', 2),
  ('456 Main Street Unit 4B', 'Salt Lake City', 'UT', '84101', 625000, 2, 2, 1200, 'Industrial chic loft in the heart of the city with floor-to-ceiling windows.', '/images/listing-2.jpg', 'new', 2),
  ('789 Oak Lane', 'Green Valley', 'UT', '84095', 550000, 3, 2, 1800, 'Charming craftsman style home with original details and a covered porch.', '/images/listing-3.jpg', 'pending', 2),
  ('321 Lakeview Dr', 'Harbor Point', 'UT', '84074', 1200000, 5, 4, 3500, 'Stunning waterfront property with private dock and panoramic views.', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', 'active', 2);

INSERT INTO listing_assignment (listing_id, buyer_id, realtor_id, assignment_role)
VALUES
  (1, 1, 1, 'lead_realtor');

INSERT INTO conversation (listing_id, buyer_id, realtor_id, last_message_at)
VALUES
  (1, 1, 1, NOW());

INSERT INTO collab_item (listing_id, created_by_user_id, item_type, title, body_text, status, due_date)
VALUES
  (1, 2, 'task', 'Submit Pre-approval', 'Upload signed pre-approval to board.', 'done', NOW() + INTERVAL '1 day'),
  (1, 1, 'task', 'Schedule Inspection', 'Coordinate inspector and confirm date/time.', 'in_progress', NOW() + INTERVAL '3 days'),
  (1, 1, 'task', 'Review HOA Documents', 'Read HOA docs and mark key questions.', 'todo', NOW() + INTERVAL '7 days'),
  (1, 2, 'note', 'Kitchen Renovation Ideas', 'Open shelving, quartz countertops, brass hardware.', 'todo', NULL),
  (1, 1, 'note', 'Questions for Seller', 'Age of roof? HVAC maintenance history?', 'todo', NULL),
  (1, 2, 'document', 'Pre-Approval Letter.pdf', NULL, 'done', NULL),
  (1, 2, 'document', 'Purchase Agreement.pdf', NULL, 'todo', NULL),
  (1, 1, 'document', 'Property Disclosure.pdf', NULL, 'todo', NULL);

INSERT INTO message (conversation_id, sender_user_id, message_text)
VALUES
  (1, 2, 'I have scheduled the viewing for Saturday at 2 PM.'),
  (1, 1, 'Perfect, thank you!');
