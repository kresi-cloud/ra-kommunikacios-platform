begin;

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create type public.account_status as enum (
  'invited', 'activation_pending', 'active', 'suspended',
  'inactive', 'expired', 'archived'
);

create type public.scope_type as enum ('global', 'project', 'content', 'task', 'event');
create type public.project_status as enum ('draft', 'active', 'closed', 'archived');

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

commit;
