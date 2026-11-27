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
