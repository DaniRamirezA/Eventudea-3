-- Run once in Supabase SQL Editor AFTER creating your own account in EventUdeA.
-- Replace the email below with the email address you used to sign up.
-- This grants the first administrator role; do not expose this SQL to regular users.
update public.profiles
set role = 'administrador', is_active = true
where lower(email) = lower('REPLACE_WITH_YOUR_EMAIL');
