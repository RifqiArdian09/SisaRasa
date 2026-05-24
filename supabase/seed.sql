-- Set role admin untuk user berdasarkan email
-- GANTI 'email@example.com' dengan email kamu
UPDATE public.users
SET role = 'admin'
WHERE email = 'email@example.com';

-- Verifikasi
SELECT id, email, name, role FROM public.users WHERE role = 'admin';
