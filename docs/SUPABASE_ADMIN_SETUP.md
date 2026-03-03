# Supabase admin access setup

The dashboard only allows users for whom **`public.is_admin()`** returns `true`. If you see "You are signed in but do not have admin access", do the following in the Supabase SQL Editor.

## 1. Create the `is_admin()` function (if it doesn’t exist)

Run this in **Supabase Dashboard → SQL Editor**:

```sql
-- Drop and recreate so you can re-run this safely
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;
```

This returns `true` only when the current user has a row in `profiles` with `role = 'admin'`.

## 2. Ensure your user has a profile with `role = 'admin'`

You must have a row in **`public.profiles`** for your auth user with **`role = 'admin'`**.

**Option A – Insert for your current user (replace with your user id):**

1. In Supabase: **Authentication → Users** → copy your user’s **UUID**.
2. Run (replace `YOUR_USER_UUID`):

```sql
insert into public.profiles (id, full_name, role)
values ('YOUR_USER_UUID', 'Admin', 'admin')
on conflict (id) do update set role = 'admin';
```

**Option B – Create profile automatically on signup (recommended)**

Run once so every new user gets a profile; then set your own role to admin as in Option A:

```sql
-- Trigger to create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'admin');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Existing users:** If the trigger was added after you signed up, you still need to insert/update your profile (Option A).

## 3. RLS (optional but recommended)

Ensure only admins can read sensitive data. Example for `profiles`:

```sql
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Optional: only admins can update profiles
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());
```

After step 1 and 2 (and 3 if you use RLS), sign out and sign in again, then open `/dashboard`. You should no longer see "You are signed in but do not have admin access."
