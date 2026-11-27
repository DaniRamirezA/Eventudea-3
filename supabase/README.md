# EventUdeA · Supabase setup

## Environment variables
Set these in Vercel:
- NEXT_PUBLIC_SUPABASE_URL=https://mzyrrgoaphzevirvngrm.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=the project's publishable key (sb_publishable_...)

Never use a service_role or sb_secret key in browser-visible variables.

## Database migrations
The SQL schema lives in `supabase/migrations/`. The Supabase GitHub integration is configured for the repository root (`.`) and production branch `main`. Enable production deployment in Supabase only when ready to apply reviewed migrations.

## First administrator
1. Register a normal account through EventUdeA.
2. In Supabase SQL Editor, run `supabase/bootstrap-admin.sql` after replacing the email placeholder with that account's email.
3. Sign out and sign in again. The account will have the administrator role.
4. The administrator can promote other registered users to organizer or administrator roles from the user management screen.

New self-registrations receive the assistant role by default.
