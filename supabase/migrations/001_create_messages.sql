-- Create messages table for LoveQR
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  message TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  song_url TEXT,
  song_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  view_count INTEGER NOT NULL DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (anyone can create a message)
CREATE POLICY "Anyone can create messages"
  ON messages
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to read a message by ID
CREATE POLICY "Anyone can read messages"
  ON messages
  FOR SELECT
  TO anon
  USING (true);

-- Allow updating view_count
CREATE POLICY "Anyone can update view count"
  ON messages
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for uploaded images
INSERT INTO storage.buckets (id, name, public)
VALUES ('loveqr-images', 'loveqr-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to storage
CREATE POLICY "Public Access"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'loveqr-images');

CREATE POLICY "Public Upload"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'loveqr-images');

CREATE POLICY "Public Update"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'loveqr-images');

CREATE POLICY "Public Delete"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'loveqr-images');
