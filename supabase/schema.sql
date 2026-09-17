-- HR Crew Room : โครงสร้างฐานข้อมูลบน Supabase
-- รันทั้งไฟล์นี้ใน SQL Editor ของโปรเจกต์ (รันซ้ำได้)

-- 1) ตารางเอกสาร: เก็บทุกคอลเลกชันในตารางเดียวแบบ JSON
create table if not exists public.docs (
  collection  text        not null,
  id          text        not null,
  data        jsonb       not null default '{}'::jsonb,
  owner       uuid        default auth.uid(),
  updated_at  timestamptz not null default now(),
  primary key (collection, id)
);
create index if not exists docs_collection_idx on public.docs (collection);
create index if not exists docs_owner_idx on public.docs (owner);

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists docs_set_updated_at on public.docs;
create trigger docs_set_updated_at
  before update on public.docs
  for each row execute function public.set_updated_at();

-- 2) ฟังก์ชันช่วยตรวจสิทธิ์ (security definer เพื่อไม่วนซ้ำกับ RLS)
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.docs
    where collection = 'members'
      and id = auth.uid()::text
      and data->>'status' = 'approved'
  );
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.docs
    where collection = 'members'
      and id = auth.uid()::text
      and data->>'status' = 'approved'
      and data->>'role' = 'admin'
  );
$$;

create or replace function public.can_write(c text, i text, d jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when c = 'private'  then left(i, length(auth.uid()::text) + 1) = auth.uid()::text || '_'
    when c = 'profiles' then i = auth.uid()::text or public.is_admin()
    when c = 'requests' then i = auth.uid()::text or public.is_admin()
    when c = 'members'  then public.is_admin()
    when c = 'dm'       then public.is_member() and (d->'parts') ? (auth.uid()::text)
    when c in ('posts','opportunities','endorsements','meetings','events') then public.is_member()
    else false
  end;
$$;

-- 3) Row Level Security
alter table public.docs enable row level security;

drop policy if exists docs_select on public.docs;
create policy docs_select on public.docs
  for select to authenticated
  using (
    case collection
      when 'private' then owner = auth.uid()
      when 'dm'      then (data->'parts') ? (auth.uid()::text)
      else true
    end
  );

drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs
  for insert to authenticated
  with check (public.can_write(collection, id, data));

drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs
  for update to authenticated
  using (public.can_write(collection, id, data))
  with check (public.can_write(collection, id, data));

drop policy if exists docs_delete on public.docs;
create policy docs_delete on public.docs
  for delete to authenticated
  using (public.can_write(collection, id, data));

grant select, insert, update, delete on public.docs to authenticated;

-- 4) เมื่อมีผู้ใช้สมัครใหม่: สร้างโปรไฟล์ให้ และให้คนแรกเป็นผู้ดูแลระบบโดยอัตโนมัติ
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
  display_name text := coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1));
begin
  insert into public.docs (collection, id, data, owner)
  values ('profiles', new.id::text, jsonb_build_object(
    'name', display_name, 'title', '', 'team', '', 'location', '', 'bio', '',
    'skills', '[]'::jsonb, 'experience', '[]'::jsonb, 'certs', '[]'::jsonb, 'following', '[]'::jsonb,
    'updatedAt', now_ms
  ), new.id)
  on conflict (collection, id) do nothing;

  if not exists (select 1 from public.docs where collection = 'members') then
    insert into public.docs (collection, id, data, owner)
    values ('members', new.id::text, jsonb_build_object(
      'status', 'approved', 'role', 'admin', 'employeeId', '', 'team', '', 'title', 'ผู้ดูแลระบบ',
      'requestedAt', now_ms, 'approvedAt', now_ms, 'approvedBy', new.id::text
    ), new.id);
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Realtime: ส่งการเปลี่ยนแปลงของตาราง docs ไปยังเบราว์เซอร์
alter table public.docs replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'docs'
  ) then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;
