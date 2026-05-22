-- Insert an admin user into public.users with an existing auth.users ID.
-- Before running this, ensure you have an existing user in auth.users table.
-- 1. Register a user (e.g., admin@sisarasa.com) through Supabase Auth (e.g., via the app's register page or Supabase Studio).
-- 2. Get the 'id' of that newly registered user from the 'auth.users' table.
-- 3. Replace 'YOUR_EXISTING_AUTH_USER_ID' below with that actual ID.
INSERT INTO users (id, role, name, email, phone, avatar_url, fcm_token)
VALUES
  (
    'YOUR_EXISTING_AUTH_USER_ID', -- <<< REPLACE THIS with the actual ID from auth.users
    'admin',
    'Admin User',
    'admin@sisarasa.com',
    '+6281234567890',
    NULL,
    NULL
  );
