-- Hapus user & semua data terkait untuk admin
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE USING (public.is_admin());
