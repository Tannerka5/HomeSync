-- Allow storing potential homes on the collaboration board.
-- Applies cleanly to an existing dev DB by widening the item_type check constraint.

ALTER TABLE collab_item
  DROP CONSTRAINT IF EXISTS collab_item_item_type_check;

ALTER TABLE collab_item
  ADD CONSTRAINT collab_item_item_type_check
  CHECK (item_type IN ('task', 'note', 'document', 'listing_candidate'));

