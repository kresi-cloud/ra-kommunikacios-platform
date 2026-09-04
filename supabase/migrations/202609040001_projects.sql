begin;

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_on date not null,
  ends_on date not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  constraint season_dates check (ends_on >= starts_on)
);

create unique index seasons_single_default on public.seasons(is_default) where is_default;

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  project_code text not null unique,
  title text not null check (char_length(title) between 1 and 250),
  summary text check (summary is null or char_length(summary) <= 2000),
  objective text check (objective is null or char_length(objective) <= 2000),
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  starts_on date,
  ends_on date,
  status public.project_status not null default 'draft',
  season_id uuid references public.seasons(id) on delete restrict,
  closed_at timestamptz,
  closed_by uuid references public.profiles(id) on delete restrict,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete restrict,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  constraint project_dates check (starts_on is null or ends_on is null or ends_on >= starts_on)
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  membership_role text not null default 'member',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  added_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create unique index project_members_active_unique
  on public.project_members(project_id, user_id) where left_at is null;

create table public.project_tags (
  project_id uuid not null references public.projects(id) on delete restrict,
  tag_id uuid not null references public.tags(id) on delete restrict,
  added_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key(project_id, tag_id)
);

-- Az I1 feladatmoduljáig csak a projektlezárást blokkoló minimális rekord.
-- A tábla a transition_project függvény előtt készül el, így a migráció
-- check_function_bodies beállítástól függetlenül is determinisztikus.
create table public.project_critical_blocks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  reason text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete restrict
);

create index projects_owner_status_idx on public.projects(owner_user_id, status);
create index projects_status_dates_idx on public.projects(status, starts_on, ends_on);
create index project_members_user_idx on public.project_members(user_id, project_id);

create trigger seasons_set_updated_at before update on public.seasons
for each row execute function private.set_updated_at();
create trigger tags_set_updated_at before update on public.tags
for each row execute function private.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
for each row execute function private.set_updated_at();

alter table public.seasons enable row level security;
alter table public.seasons force row level security;
alter table public.tags enable row level security;
alter table public.tags force row level security;
alter table public.projects enable row level security;
alter table public.projects force row level security;
alter table public.project_members enable row level security;
alter table public.project_members force row level security;
alter table public.project_tags enable row level security;
alter table public.project_tags force row level security;
alter table public.project_critical_blocks enable row level security;
alter table public.project_critical_blocks force row level security;

create or replace function private.is_project_owner(target_project_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_active_user() and exists (
    select 1 from public.projects p
    where p.id = target_project_id
      and p.owner_user_id = auth.uid()
      and p.deleted_at is null
  )
$$;

create or replace function private.is_project_member(target_project_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_active_user() and exists (
    select 1 from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = auth.uid()
      and pm.left_at is null
  )
$$;

create or replace function private.can_access_project(target_project_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_active_user()
    and not private.is_technical_admin()
    and (
      private.is_communication_lead()
      or private.is_project_owner(target_project_id)
      or private.is_project_member(target_project_id)
    )
$$;

revoke all on function private.is_project_owner(uuid) from public, anon;
revoke all on function private.is_project_member(uuid) from public, anon;
revoke all on function private.can_access_project(uuid) from public, anon;
grant execute on function private.is_project_owner(uuid) to authenticated;
grant execute on function private.is_project_member(uuid) to authenticated;
grant execute on function private.can_access_project(uuid) to authenticated;

create policy seasons_read on public.seasons for select to authenticated
using (private.is_active_user() and is_active);

create policy tags_read on public.tags for select to authenticated
using (private.is_active_user() and is_active);

create policy projects_read on public.projects for select to authenticated
using (deleted_at is null and private.can_access_project(id));

create policy project_members_read on public.project_members for select to authenticated
using (private.can_access_project(project_id));

create policy project_tags_read on public.project_tags for select to authenticated
using (private.can_access_project(project_id));

create policy project_critical_blocks_read on public.project_critical_blocks for select to authenticated
using (private.can_access_project(project_id));

grant select on public.seasons, public.tags, public.projects, public.project_members, public.project_tags,
  public.project_critical_blocks to authenticated;
revoke insert, update, delete on public.seasons, public.tags, public.projects, public.project_members,
  public.project_tags, public.project_critical_blocks from anon, authenticated;

create or replace function public.create_project(
  project_title text,
  project_owner_user_id uuid,
  project_summary text default null,
  project_objective text default null,
  project_starts_on date default null,
  project_ends_on date default null,
  project_season_id uuid default null
)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_project public.projects;
  normalized_title text := btrim(project_title);
begin
  if not private.is_active_user() then raise exception 'Nincs aktív felhasználói hozzáférés.' using errcode = '42501'; end if;
  if private.is_technical_admin() then raise exception 'A technikai admin nem hozhat létre kommunikációs projektet.' using errcode = '42501'; end if;
  if not (private.is_communication_lead() or private.has_permission('create_project')) then
    raise exception 'Nincs jogosultság projekt létrehozására.' using errcode = '42501';
  end if;
  if normalized_title = '' or char_length(normalized_title) > 250 then raise exception 'A projekt címe hibás.' using errcode = '22023'; end if;
  if project_starts_on is not null and project_ends_on is not null and project_ends_on < project_starts_on then
    raise exception 'A projekt vége nem lehet korábbi a kezdésénél.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = project_owner_user_id and p.account_status = 'active' and p.is_internal_member
  ) then raise exception 'A projektgazda nem aktív belső felhasználó.' using errcode = '22023'; end if;

  insert into public.projects(
    project_code, title, summary, objective, owner_user_id, starts_on, ends_on,
    season_id, created_by, updated_by
  ) values (
    'RA-PROJ-' || to_char(now() at time zone 'Europe/Budapest', 'YYYY') || '-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8)),
    normalized_title, project_summary, project_objective, project_owner_user_id,
    project_starts_on, project_ends_on, project_season_id, auth.uid(), auth.uid()
  ) returning * into created_project;

  insert into public.project_members(project_id, user_id, membership_role, added_by)
  values (created_project.id, project_owner_user_id, 'owner', auth.uid());

  perform private.write_audit(
    'project.created', 'project', created_project.id, created_project.id,
    null, jsonb_build_object('status', created_project.status, 'owner_user_id', created_project.owner_user_id), null
  );
  return created_project;
end;
$$;

create or replace function public.transition_project(
  target_project_id uuid,
  target_status public.project_status,
  transition_reason text default null
)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_project public.projects;
  is_lead boolean := private.is_communication_lead();
  previous_status public.project_status;
begin
  select * into current_project from public.projects where id = target_project_id and deleted_at is null for update;
  if not found then raise exception 'A projekt nem található.' using errcode = 'P0002'; end if;
  previous_status := current_project.status;
  if not (
    is_lead or (
      current_project.owner_user_id = auth.uid()
      and (
        private.has_role('project_owner')
        or private.has_role('project_owner', 'project', target_project_id)
      )
    )
  ) then
    raise exception 'Nincs jogosultság a projekt állapotváltására.' using errcode = '42501';
  end if;
  if current_project.status = target_status then raise exception 'Az új állapot megegyezik a jelenlegivel.' using errcode = '22023'; end if;

  if current_project.status = 'draft' and target_status = 'active' then null;
  elsif current_project.status = 'active' and target_status = 'closed' then
    if exists (select 1 from public.project_critical_blocks b where b.project_id = target_project_id and b.resolved_at is null) then
      raise exception 'Aktív kritikus blokk mellett a projekt nem zárható le.' using errcode = '23514';
    end if;
  elsif is_lead and current_project.status = 'closed' and target_status = 'archived' then null;
  elsif is_lead and current_project.status in ('closed', 'archived') and target_status = 'active' and nullif(btrim(transition_reason), '') is not null then null;
  else raise exception 'Nem engedélyezett projektállapot-átmenet.' using errcode = '23514';
  end if;

  update public.projects set
    status = target_status,
    closed_at = case when target_status = 'closed' then now() else null end,
    closed_by = case when target_status = 'closed' then auth.uid() else null end,
    archived_at = case when target_status = 'archived' then now() else null end,
    archived_by = case when target_status = 'archived' then auth.uid() else null end,
    updated_by = auth.uid()
  where id = target_project_id returning * into current_project;

  perform private.write_audit(
    'project.transitioned', 'project', current_project.id, current_project.id,
    jsonb_build_object('status', previous_status),
    jsonb_build_object('status', target_status), transition_reason
  );
  return current_project;
end;
$$;

revoke all on function public.create_project(text, uuid, text, text, date, date, uuid) from public, anon;
grant execute on function public.create_project(text, uuid, text, text, date, date, uuid) to authenticated;
revoke all on function public.transition_project(uuid, public.project_status, text) from public, anon;
grant execute on function public.transition_project(uuid, public.project_status, text) to authenticated;

commit;
