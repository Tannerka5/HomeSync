-- Drops all HomeSync tables and re-creates them from scratch.
-- Use for local development when the schema has changed.
-- Usage: psql "$DATABASE_URL" -f db/reset.sql

DROP TABLE IF EXISTS message CASCADE;
DROP TABLE IF EXISTS collab_item CASCADE;
DROP TABLE IF EXISTS conversation CASCADE;
DROP TABLE IF EXISTS listing_assignment CASCADE;
DROP TABLE IF EXISTS listing CASCADE;
DROP TABLE IF EXISTS realtor CASCADE;
DROP TABLE IF EXISTS buyer CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;

\i schema.sql
\i seed.sql
