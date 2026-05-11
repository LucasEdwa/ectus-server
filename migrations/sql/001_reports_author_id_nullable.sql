-- Align reports.author_id with nullable author on databases created before the schema matched production code.
-- Safe no-op when column definition already matches.
ALTER TABLE reports MODIFY COLUMN author_id INT UNSIGNED NULL;
