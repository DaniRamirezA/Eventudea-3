-- Complete EventUdeA profile metadata and PostgREST permissions.
alter table public.profiles add column if not exists email text;
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), lower(new.email))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
grant select on public.categories, public.venues, public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;
grant insert, update, delete on public.categories, public.venues, public.certificate_templates to authenticated;
grant select, insert, update, delete on public.certificate_templates to authenticated;
grant select on public.profiles to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Organizers can identify attendees registered for their own events.
drop policy if exists "profiles_read_event_participants" on public.profiles;
create policy "profiles_read_event_participants" on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or public.is_app_admin()
  or exists (
    select 1
    from public.registrations r
    join public.events e on e.id = r.event_id
    where r.user_id = profiles.id and e.organizer_id = (select auth.uid())
  )
);
