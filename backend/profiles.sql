-- Profiles table for Supabase Auth users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY, -- Supabase UID
  email VARCHAR(100) UNIQUE NOT NULL,
  username VARCHAR(50) NOT NULL
);
