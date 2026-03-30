-- Allow storing vision board images on the collaboration board.
-- Widens the item_type check constraint to include 'vision_board'.

ALTER TABLE collab_item
  DROP CONSTRAINT IF EXISTS collab_item_item_type_check;

ALTER TABLE collab_item
  ADD CONSTRAINT collab_item_item_type_check
  CHECK (item_type IN ('task', 'note', 'document', 'listing_candidate', 'vision_board'));
