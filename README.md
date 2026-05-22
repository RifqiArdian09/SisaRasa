# SisaRasa - README

## Setup Admin User

To add an admin user to your Supabase project, you can use the SQL script located at `supabase/seed.sql`.

**IMPORTANT: Before running the SQL, you must first create a user via Supabase Authentication and then use that user's ID.**

### Steps:

1.  **Register an Admin Account**: Create a user account (e.g., using `admin@sisarasa.com`) through the Supabase authentication system. You can do this by:
    *   Registering through the SisaRasa application's `/register` page once it's implemented.
    *   Manually adding a user in the Supabase Studio dashboard under "Authentication" -> "Users" -> "Invite User" or "Add user".

2.  **Retrieve User ID**: After the user is created, go to Supabase Studio, navigate to "Authentication" -> "Users", and copy the `ID` (UUID) of the user you just created.

3.  **Update `supabase/seed.sql`**: Open the `supabase/seed.sql` file in this project and replace `'YOUR_EXISTING_AUTH_USER_ID'` with the actual `ID` you copied from the `auth.users` table.

4.  **Execute SQL Query**: 
    *   Go to your Supabase project dashboard.
    *   Navigate to the "SQL Editor" section.
    *   Copy the updated content of `supabase/seed.sql`.
    *   Paste the SQL into the editor and click "Run" to execute it.

Example `supabase/seed.sql` content (after replacing the placeholder):

```sql
-- Insert an admin user into public.users with an existing auth.users ID.
-- Before running this, ensure you have an existing user in auth.users table.
-- 1. Register a user (e.g., admin@sisarasa.com) through Supabase Auth (e.g., via the app's register page or Supabase Studio).
-- 2. Get the 'id' of that newly registered user from the 'auth.users' table.
-- 3. Replace 'YOUR_EXISTING_AUTH_USER_ID' below with that actual ID.
INSERT INTO users (id, role, name, email, phone, avatar_url, fcm_token)
VALUES
  (
    '5c23820d-a063-41ad-9672-b09e3940f7ed', -- <<< EXAMPLE ID, REPLACE THIS
    'admin',
    'Admin User',
    'admin@sisarasa.com',
    '+6281234567890',
    NULL,
    NULL
  );
```
