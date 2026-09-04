begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (char_length(display_name) between 1 and 250),
  email citext not null unique,
  job_title text,
  organizational_unit text,
  is_internal_member boolean not null,
  account_status public.account_status not null default 'activation_pending',
  external_expires_at timestamptz,
  locale text not null default 'hu-HU' check (locale = 'hu-HU'),
  timezone text not null default 'Europe/Budapest' check (timezone = 'Europe/Budapest'),
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete restrict,
  constraint external_expiry_required check (is_internal_member or external_expires_at is not null)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_hu text not null,
  is_system_role boolean not null default true,
  requires_mfa boolean not null default false,
  is_active boolean not null default true
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_hu text not null,
  is_active boolean not null default true
);

create table public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  role_id uuid not null references public.roles(id) on delete restrict,
  scope_type public.scope_type not null default 'global',
  scope_id uuid,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  appointed_by uuid not null references public.profiles(id) on delete restrict,
  initiated_by uuid not null references public.profiles(id) on delete restrict,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete restrict,
  reason text not null check (char_length(reason) between 1 and 2000),
  created_at timestamptz not null default now(),
  constraint role_scope_shape check (
    (scope_type = 'global' and scope_id is null) or
    (scope_type <> 'global' and scope_id is not null)
  ),
  constraint role_validity check (valid_until is null or valid_until > valid_from)
);

create unique index user_role_assignments_active_unique
  on public.user_role_assignments (user_id, role_id, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where revoked_at is null;

create unique index single_active_namesake
  on public.user_role_assignments (role_id)
  where revoked_at is null
    and scope_type = 'global'
    and role_id = '10000000-0000-0000-0000-000000000006'::uuid;

create table public.user_permission_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  permission_id uuid not null references public.permissions(id) on delete restrict,
  scope_type public.scope_type not null default 'global',
  scope_id uuid,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  appointed_by uuid not null references public.profiles(id) on delete restrict,
  initiated_by uuid not null references public.profiles(id) on delete restrict,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete restrict,
  reason text not null check (char_length(reason) between 1 and 2000),
  created_at timestamptz not null default now(),
  constraint permission_scope_shape check (
    (scope_type = 'global' and scope_id is null) or
    (scope_type <> 'global' and scope_id is not null)
  ),
  constraint permission_validity check (valid_until is null or valid_until > valid_from)
);

create unique index user_permission_grants_active_unique
  on public.user_permission_grants (user_id, permission_id, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where revoked_at is null;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  token_hash text not null unique check (char_length(token_hash) >= 64),
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  initiated_by uuid not null references public.profiles(id) on delete restrict,
  approved_role_payload jsonb not null default '[]'::jsonb,
  approved_by uuid not null references public.profiles(id) on delete restrict,
  accepted_user_id uuid references public.profiles(id) on delete restrict,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invitation_expiry check (expires_at > created_at)
);

create table public.bootstrap_activations (
  id uuid primary key default gen_random_uuid(),
  role_code text not null check (role_code in ('technical_admin', 'communication_lead')),
  token_hash text not null unique check (char_length(token_hash) >= 64),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.delegations (
  id uuid primary key default gen_random_uuid(),
  delegator_user_id uuid not null references public.profiles(id) on delete restrict,
  delegate_user_id uuid not null references public.profiles(id) on delete restrict,
  scope_type public.scope_type not null,
  scope_id uuid,
  permission_codes text[] not null check (cardinality(permission_codes) > 0),
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint delegation_users_differ check (delegator_user_id <> delegate_user_id),
  constraint delegation_validity check (valid_until > valid_from),
  constraint delegation_scope_shape check (
    (scope_type = 'global' and scope_id is null) or
    (scope_type <> 'global' and scope_id is not null)
  )
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references public.profiles(id) on delete restrict,
  actor_type text not null check (actor_type in ('user', 'system', 'service')),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  project_id uuid,
  old_values jsonb,
  new_values jsonb,
  reason text,
  request_id text,
  ip_hash text,
  user_agent_summary text,
  metadata jsonb not null default '{}'::jsonb
);

create index audit_log_entity_idx on public.audit_log(entity_type, entity_id, occurred_at desc);
create index audit_log_actor_idx on public.audit_log(actor_user_id, occurred_at desc);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.roles enable row level security;
alter table public.roles force row level security;
alter table public.permissions enable row level security;
alter table public.permissions force row level security;
alter table public.user_role_assignments enable row level security;
alter table public.user_role_assignments force row level security;
alter table public.user_permission_grants enable row level security;
alter table public.user_permission_grants force row level security;
alter table public.invitations enable row level security;
alter table public.invitations force row level security;
alter table public.bootstrap_activations enable row level security;
alter table public.bootstrap_activations force row level security;
alter table public.delegations enable row level security;
alter table public.delegations force row level security;
alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

create or replace function private.current_user_id()
returns uuid language sql stable security invoker set search_path = ''
as $$ select auth.uid() $$;

create or replace function private.is_active_user(user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = user_id
      and p.account_status = 'active'
      and (p.is_internal_member or p.external_expires_at > now())
  )
$$;

create or replace function private.has_role(
  role_code text,
  requested_scope public.scope_type default 'global',
  requested_scope_id uuid default null
)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_active_user() and exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = auth.uid()
      and r.code = role_code
      and r.is_active
      and ura.revoked_at is null
      and ura.valid_from <= now()
      and (ura.valid_until is null or ura.valid_until > now())
      and (
        ura.scope_type = 'global'
        or (ura.scope_type = requested_scope and ura.scope_id = requested_scope_id)
      )
  )
$$;

create or replace function private.has_permission(
  permission_code text,
  requested_scope public.scope_type default 'global',
  requested_scope_id uuid default null
)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_active_user() and exists (
    select 1
    from public.user_permission_grants upg
    join public.permissions p on p.id = upg.permission_id
    where upg.user_id = auth.uid()
      and p.code = permission_code
      and p.is_active
      and upg.revoked_at is null
      and upg.valid_from <= now()
      and (upg.valid_until is null or upg.valid_until > now())
      and (
        upg.scope_type = 'global'
        or (upg.scope_type = requested_scope and upg.scope_id = requested_scope_id)
      )
  )
$$;

create or replace function private.is_communication_lead()
returns boolean language sql stable security definer set search_path = ''
as $$ select private.has_role('communication_lead') $$;

create or replace function private.is_technical_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select private.has_role('technical_admin') $$;

create or replace function private.write_audit(
  action_code text,
  target_type text,
  target_id uuid,
  target_project_id uuid,
  previous_values jsonb,
  next_values jsonb,
  action_reason text
)
returns uuid language plpgsql volatile security definer set search_path = ''
as $$
declare audit_id uuid;
begin
  insert into public.audit_log(
    actor_user_id, actor_type, action, entity_type, entity_id,
    project_id, old_values, new_values, reason
  ) values (
    auth.uid(), case when auth.uid() is null then 'system' else 'user' end,
    action_code, target_type, target_id, target_project_id,
    previous_values, next_values, action_reason
  ) returning id into audit_id;
  return audit_id;
end;
$$;

revoke all on all functions in schema private from public, anon;
grant execute on function private.current_user_id() to authenticated;
grant execute on function private.is_active_user(uuid) to authenticated;
grant execute on function private.has_role(text, public.scope_type, uuid) to authenticated;
grant execute on function private.has_permission(text, public.scope_type, uuid) to authenticated;
grant execute on function private.is_communication_lead() to authenticated;
grant execute on function private.is_technical_admin() to authenticated;
revoke all on function private.write_audit(text, text, uuid, uuid, jsonb, jsonb, text) from authenticated;

create policy profiles_select_self on public.profiles for select to authenticated
using (private.is_active_user() and id = auth.uid());

create policy profiles_update_self on public.profiles for update to authenticated
using (private.is_active_user() and id = auth.uid())
with check (id = auth.uid() and account_status = 'active');

create policy roles_read_active on public.roles for select to authenticated
using (private.is_active_user() and is_active);

create policy permissions_read_active on public.permissions for select to authenticated
using (private.is_active_user() and is_active);

create policy role_assignments_read_self on public.user_role_assignments for select to authenticated
using (private.is_active_user() and (user_id = auth.uid() or private.is_communication_lead()));

create policy permission_grants_read_self on public.user_permission_grants for select to authenticated
using (private.is_active_user() and (user_id = auth.uid() or private.is_communication_lead()));

create policy delegations_read_involved on public.delegations for select to authenticated
using (private.is_active_user() and (delegator_user_id = auth.uid() or delegate_user_id = auth.uid() or private.is_communication_lead()));

create policy audit_read_lead on public.audit_log for select to authenticated
using (private.is_communication_lead());

revoke insert, update, delete on public.audit_log from anon, authenticated;
revoke all on public.invitations, public.bootstrap_activations from anon, authenticated;
revoke update on public.profiles from authenticated;
grant select on public.profiles, public.roles, public.permissions,
  public.user_role_assignments, public.user_permission_grants,
  public.delegations, public.audit_log to authenticated;
grant update(display_name, job_title, organizational_unit) on public.profiles to authenticated;

insert into public.roles(id, code, name_hu, requires_mfa) values
  ('10000000-0000-0000-0000-000000000001', 'communication_lead', 'Kommunikációs vezető', true),
  ('10000000-0000-0000-0000-000000000002', 'technical_admin', 'Technikai admin', true),
  ('10000000-0000-0000-0000-000000000003', 'project_owner', 'Projektgazda', true),
  ('10000000-0000-0000-0000-000000000004', 'staff_member', 'Szervezeti munkatárs', false),
  ('10000000-0000-0000-0000-000000000005', 'privacy_legal_officer', 'Adatvédelmi/jogi felelős', true),
  ('10000000-0000-0000-0000-000000000006', 'namesake', 'Névadó', true),
  ('10000000-0000-0000-0000-000000000007', 'external_contributor', 'Külső közreműködő', false)
on conflict (code) do update set name_hu = excluded.name_hu, requires_mfa = excluded.requires_mfa;

insert into public.permissions(code, name_hu) values
  ('create_project', 'Projekt létrehozása'),
  ('mark_ready_to_publish', 'Publikálásra előkészítés'),
  ('publish_content', 'Publikálás'),
  ('manage_person_profiles', 'Személyprofilok kezelése'),
  ('manage_permission_documents', 'Megjelenési dokumentumok kezelése'),
  ('view_press_recipient_details', 'Sajtócímzettek részletei'),
  ('import_standard_data', 'Normál adatok importja'),
  ('import_sensitive_data', 'Érzékeny adatok importja'),
  ('view_project_workload', 'Projektterhelés megtekintése'),
  ('access_sensitive_support_attachment', 'Érzékeny hibajegy-melléklet')
on conflict (code) do update set name_hu = excluded.name_hu;

commit;
