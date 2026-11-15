-- Pega todo esto en Supabase > SQL Editor > Run.
-- 1) Administradoras (correos de Google EN MINÚSCULAS): cámbialos por los vuestros.
create table if not exists admins (email text primary key);
insert into admins values ('ena.ateibuz@gmail.com') on conflict do nothing;
alter table admins enable row level security;  -- sin políticas: nadie la lee directamente

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from admins where email = lower(auth.jwt() ->> 'email')) $$;

-- 2) Citas telefónicas
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (char_length(phone) between 6 and 25),
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now()
);
alter table appointments enable row level security;
create policy "crear mi cita" on appointments for insert to authenticated with check (user_id = auth.uid());
create policy "ver mis citas o admin" on appointments for select to authenticated using (user_id = auth.uid() or is_admin());

-- 3) Proyectos y material
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 120),
  description text default '' check (char_length(description) <= 400),
  kind text not null check (kind in ('video','pdf','file','link')),
  path text, url text,
  created_at timestamptz not null default now()
);
alter table materials enable row level security;
create policy "ver todos" on materials for select to anon, authenticated using (true);
create policy "admin inserta" on materials for insert to authenticated with check (is_admin());
create policy "admin borra" on materials for delete to authenticated using (is_admin());

-- 4) Almacenamiento (bucket público de lectura, 50 MB por archivo)
insert into storage.buckets (id, name, public, file_size_limit) values ('materials', 'materials', true, 52428800)
  on conflict (id) do update set file_size_limit = 52428800;
create policy "admin sube" on storage.objects for insert to authenticated with check (bucket_id = 'materials' and is_admin());
create policy "admin borra archivos" on storage.objects for delete to authenticated using (bucket_id = 'materials' and is_admin());
