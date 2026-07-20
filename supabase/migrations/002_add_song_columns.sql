-- Add song columns to existing messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS song_url TEXT,
ADD COLUMN IF NOT EXISTS song_title TEXT;
