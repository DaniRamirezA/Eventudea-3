-- Persist the role selected during Supabase Auth signup.
-- Only self-service roles are accepted; administrator is never assignable at signup.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  v_role := case
    when new.raw_user_meta_data ->> 'role' = 'organizador' then 'organizador'
    else 'asistente'
  end;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    lower(new.email),
    v_role
  )
  on conflict (id) do update
    set email = excluded.email,
        role = case
          when public.profiles.role = 'administrador' then 'administrador'
          else excluded.role
        end;

  return new;
end;
$$;

-- Recreate trigger to ensure the updated function is used for future signups.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
