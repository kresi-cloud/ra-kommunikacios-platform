begin;

create type public.task_status as enum (
  'draft', 'assigned', 'accepted', 'in_progress', 'clarification_needed',
  'blocked', 'in_review', 'completed', 'withdrawn', 'archived'
);
create type public.task_acceptance_status as enum (
  'not_requested', 'pending', 'accepted', 'clarification_requested', 'obstacle_reported'
);
create type public.priority_level as enum ('normal', 'critical');
create type public.event_status as enum (
  'draft', 'scheduled', 'occurred', 'cancelled', 'postponed', 'archived'
);
create type public.event_outcome as enum ('did_not_occur');
create type public.event_type as enum (
  'match', 'professional_program', 'interview', 'production', 'press_event',
  'event', 'meeting', 'travel', 'conference', 'scientific_event', 'other'
);
create type public.event_participant_type as enum ('user', 'person', 'external');
create type public.event_participant_status as enum (
  'invited', 'accepted', 'declined', 'maybe', 'pending', 'no_response_required'
);
create type public.availability_source as enum ('manual', 'google');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  event_code text not null unique,
  title text not null check (char_length(title) between 1 and 250),
  description text check (description is null or char_length(description) <= 10000),
  event_type public.event_type not null,
  responsible_user_id uuid not null references public.profiles(id) on delete restrict,
  project_id uuid references public.projects(id) on delete restrict,
  -- A contents tábla az I2-ben készül el; az UUID addig nem kap ideiglenes FK-t.
  content_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  location_name text,
  location_address text,
  online_url text,
  is_mandatory boolean not null default false,
  response_due_at timestamptz,
  status public.event_status not null default 'draft',
  outcome_code public.event_outcome,
  importance_for_namesake boolean not null default false,
  cancel_reason text,
  postpone_reason text,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete restrict,
  constraint event_times check (starts_at is null or ends_at is null or ends_at > starts_at),
  constraint scheduled_event_complete check (
    status <> 'scheduled' or (
      starts_at is not null and ends_at is not null
      and (nullif(btrim(location_name), '') is not null or nullif(btrim(online_url), '') is not null)
    )
  ),
  constraint did_not_occur_shape check (
    outcome_code is null or (status = 'cancelled' and outcome_code = 'did_not_occur')
  )
);

create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  participant_type public.event_participant_type not null,
  user_id uuid references public.profiles(id) on delete restrict,
  -- A persons tábla az I3-ban készül el; az UUID addig nem kap ideiglenes FK-t.
  person_id uuid,
  external_name text,
  external_email citext,
  status public.event_participant_status not null default 'pending',
  response_required boolean not null default true,
  responded_at timestamptz,
  responded_by_user_id uuid references public.profiles(id) on delete restrict,
  invited_at timestamptz not null default now(),
  invited_by uuid not null references public.profiles(id) on delete restrict,
  constraint participant_identity check (
    (participant_type = 'user' and user_id is not null and person_id is null and external_name is null and external_email is null)
    or (participant_type = 'person' and user_id is null and person_id is not null and external_name is null and external_email is null)
    or (participant_type = 'external' and user_id is null and person_id is null and nullif(btrim(external_name), '') is not null)
  ),
  constraint participant_response_shape check (
    (response_required and status <> 'no_response_required')
    or (not response_required and status = 'no_response_required')
  )
);

create unique index event_participants_user_unique
  on public.event_participants(event_id, user_id) where user_id is not null;
create unique index event_participants_person_unique
  on public.event_participants(event_id, person_id) where person_id is not null;

create table public.event_change_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  change_type text not null,
  old_values jsonb,
  new_values jsonb,
  reason text,
  requires_reconfirmation boolean not null,
  changed_by uuid references public.profiles(id) on delete restrict,
  changed_at timestamptz not null default now()
);

create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  visibility text not null default 'busy_only' check (visibility = 'busy_only'),
  source public.availability_source not null default 'manual',
  external_event_hash text,
  created_at timestamptz not null default now(),
  constraint availability_times check (ends_at > starts_at),
  constraint google_hash_required check (source <> 'google' or external_event_hash is not null)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  task_code text not null unique,
  title text not null check (char_length(title) between 1 and 250),
  description text check (description is null or char_length(description) <= 10000),
  responsible_user_id uuid not null references public.profiles(id) on delete restrict,
  project_id uuid references public.projects(id) on delete restrict,
  content_id uuid,
  event_id uuid references public.events(id) on delete restrict,
  parent_task_id uuid references public.tasks(id) on delete restrict,
  status public.task_status not null default 'draft',
  acceptance_status public.task_acceptance_status not null default 'not_requested',
  priority public.priority_level not null default 'normal',
  due_at timestamptz,
  unscheduled boolean not null default true,
  is_publication_required boolean not null default false,
  requires_review boolean not null default false,
  reviewer_user_id uuid references public.profiles(id) on delete restrict,
  started_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete restrict,
  withdrawn_at timestamptz,
  withdrawn_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  constraint task_schedule_shape check (
    (unscheduled and due_at is null) or (not unscheduled and due_at is not null)
  ),
  constraint task_review_shape check (not requires_review or reviewer_user_id is not null),
  constraint publication_task_due check (
    not (is_publication_required and status = 'in_progress' and due_at is null)
  ),
  constraint task_not_own_parent check (parent_task_id is null or parent_task_id <> id)
);

create table public.task_assignments_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete restrict,
  from_user_id uuid references public.profiles(id) on delete restrict,
  to_user_id uuid not null references public.profiles(id) on delete restrict,
  reason text not null check (char_length(btrim(reason)) between 1 and 2000),
  changed_by uuid not null references public.profiles(id) on delete restrict,
  changed_at timestamptz not null default now()
);

create table public.task_deadline_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete restrict,
  old_due_at timestamptz,
  new_due_at timestamptz,
  reason text not null check (char_length(btrim(reason)) between 1 and 2000),
  changed_by uuid not null references public.profiles(id) on delete restrict,
  changed_at timestamptz not null default now(),
  constraint deadline_changed check (old_due_at is distinct from new_due_at)
);

create table public.task_block_details (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete restrict,
  block_reason_code text not null,
  details text not null check (char_length(btrim(details)) between 1 and 4000),
  waiting_for_user_id uuid references public.profiles(id) on delete restrict,
  waiting_for_external_party boolean not null default false,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete restrict,
  resolution_note text
);

create unique index task_active_block_unique
  on public.task_block_details(task_id) where resolved_at is null;
create index tasks_responsible_status_idx on public.tasks(responsible_user_id, status, due_at);
create index tasks_project_status_idx on public.tasks(project_id, status, due_at);
create index events_time_idx on public.events(starts_at, ends_at) where status <> 'archived';
create index events_project_time_idx on public.events(project_id, starts_at);
create index event_participants_user_idx on public.event_participants(user_id, event_id);
create index availability_user_time_idx on public.availability_blocks(user_id, starts_at, ends_at);

create trigger tasks_set_updated_at before update on public.tasks
for each row execute function private.set_updated_at();
create trigger events_set_updated_at before update on public.events
for each row execute function private.set_updated_at();

alter table public.tasks enable row level security;
alter table public.tasks force row level security;
alter table public.task_assignments_history enable row level security;
alter table public.task_assignments_history force row level security;
alter table public.task_deadline_history enable row level security;
alter table public.task_deadline_history force row level security;
alter table public.task_block_details enable row level security;
alter table public.task_block_details force row level security;
alter table public.events enable row level security;
alter table public.events force row level security;
alter table public.event_participants enable row level security;
alter table public.event_participants force row level security;
alter table public.event_change_log enable row level security;
alter table public.event_change_log force row level security;
alter table public.availability_blocks enable row level security;
alter table public.availability_blocks force row level security;

create or replace function private.can_access_task(target_task_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_active_user()
    and not private.is_technical_admin()
    and exists (
      select 1 from public.tasks t
      where t.id = target_task_id
        and (
          private.is_communication_lead()
          or t.responsible_user_id = auth.uid()
          or (t.project_id is not null and private.can_access_project(t.project_id))
        )
    )
$$;

create or replace function private.can_manage_event(target_event_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_active_user()
    and not private.is_technical_admin()
    and exists (
      select 1 from public.events e
      where e.id = target_event_id
        and (
          private.is_communication_lead()
          or e.responsible_user_id = auth.uid()
          or (e.project_id is not null and private.is_project_owner(e.project_id))
        )
    )
$$;

create or replace function private.can_access_event(target_event_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_active_user()
    and not private.is_technical_admin()
    and exists (
      select 1 from public.events e
      where e.id = target_event_id
        and (
          private.can_manage_event(e.id)
          or (e.project_id is not null and private.can_access_project(e.project_id))
          or exists (
            select 1 from public.event_participants ep
            where ep.event_id = e.id and ep.user_id = auth.uid()
          )
          or (e.importance_for_namesake and private.has_role('namesake'))
        )
    )
$$;

revoke all on function private.can_access_task(uuid) from public, anon;
revoke all on function private.can_manage_event(uuid) from public, anon;
revoke all on function private.can_access_event(uuid) from public, anon;
grant execute on function private.can_access_task(uuid) to authenticated;
grant execute on function private.can_manage_event(uuid) to authenticated;
grant execute on function private.can_access_event(uuid) to authenticated;

create policy tasks_read on public.tasks for select to authenticated
using (private.can_access_task(id));
create policy task_assignments_read on public.task_assignments_history for select to authenticated
using (private.can_access_task(task_id));
create policy task_deadlines_read on public.task_deadline_history for select to authenticated
using (private.can_access_task(task_id));
create policy task_blocks_read on public.task_block_details for select to authenticated
using (private.can_access_task(task_id));

create policy events_read on public.events for select to authenticated
using (private.can_access_event(id));
create policy event_participants_read on public.event_participants for select to authenticated
using (private.can_access_event(event_id));
create policy event_changes_read on public.event_change_log for select to authenticated
using (private.can_access_event(event_id));
create policy availability_read_own on public.availability_blocks for select to authenticated
using (private.is_active_user() and not private.is_technical_admin() and user_id = auth.uid());

grant select on public.tasks, public.task_assignments_history, public.task_deadline_history,
  public.task_block_details, public.events, public.event_participants,
  public.event_change_log, public.availability_blocks to authenticated;
revoke all on public.tasks, public.task_assignments_history, public.task_deadline_history,
  public.task_block_details, public.events, public.event_participants,
  public.event_change_log, public.availability_blocks from anon;
revoke insert, update, delete on public.tasks, public.task_assignments_history,
  public.task_deadline_history, public.task_block_details, public.events,
  public.event_participants, public.event_change_log, public.availability_blocks from authenticated;

create or replace function public.create_task(
  task_title text,
  task_responsible_user_id uuid,
  task_project_id uuid default null,
  task_description text default null,
  task_due_at timestamptz default null,
  task_priority public.priority_level default 'normal',
  task_requires_review boolean default false,
  task_reviewer_user_id uuid default null,
  assign_immediately boolean default true,
  critical_reason text default null
)
returns public.tasks
language plpgsql security definer set search_path = ''
as $$
declare
  created_task public.tasks;
  normalized_title text := btrim(task_title);
begin
  if not private.is_active_user() or private.is_technical_admin() then
    raise exception 'Nincs jogosultság feladat létrehozására.' using errcode = '42501';
  end if;
  if task_project_id is null then
    if not (private.is_communication_lead() or task_responsible_user_id = auth.uid()) then
      raise exception 'Önálló feladat csak saját részre hozható létre.' using errcode = '42501';
    end if;
  elsif not (private.is_communication_lead() or private.is_project_owner(task_project_id)) then
    raise exception 'A projektben nincs feladatlétrehozási jogosultság.' using errcode = '42501';
  end if;
  if normalized_title = '' or char_length(normalized_title) > 250 then
    raise exception 'A feladat címe hibás.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles p where p.id = task_responsible_user_id
      and p.account_status = 'active' and (p.is_internal_member or p.external_expires_at > now())
  ) then raise exception 'A felelős nem aktív felhasználó.' using errcode = '22023'; end if;
  if task_priority = 'critical' and nullif(btrim(critical_reason), '') is null then
    raise exception 'Kritikus prioritáshoz indoklás szükséges.' using errcode = '22023';
  end if;
  if task_requires_review and task_reviewer_user_id is null then
    raise exception 'Felülvizsgálathoz felülvizsgáló szükséges.' using errcode = '22023';
  end if;

  insert into public.tasks(
    task_code, title, description, responsible_user_id, project_id, status,
    acceptance_status, priority, due_at, unscheduled, requires_review,
    reviewer_user_id, created_by, updated_by
  ) values (
    'RA-TASK-' || to_char(now() at time zone 'Europe/Budapest', 'YYYY') || '-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8)),
    normalized_title, task_description, task_responsible_user_id, task_project_id,
    case when assign_immediately then 'assigned'::public.task_status else 'draft'::public.task_status end,
    case when assign_immediately then 'pending'::public.task_acceptance_status else 'not_requested'::public.task_acceptance_status end,
    task_priority, task_due_at, task_due_at is null, task_requires_review,
    task_reviewer_user_id, auth.uid(), auth.uid()
  ) returning * into created_task;

  insert into public.task_assignments_history(task_id, from_user_id, to_user_id, reason, changed_by)
  values (created_task.id, null, task_responsible_user_id, 'Első kijelölés', auth.uid());
  perform private.write_audit(
    'task.created', 'task', created_task.id, created_task.project_id, null,
    jsonb_build_object('status', created_task.status, 'responsible_user_id', created_task.responsible_user_id,
      'priority', created_task.priority, 'critical_reason', critical_reason), null
  );
  return created_task;
end;
$$;

create or replace function public.transition_task(
  target_task_id uuid,
  target_status public.task_status,
  transition_reason text default null,
  new_due_at timestamptz default null,
  confirm_existing_due boolean default false
)
returns public.tasks
language plpgsql security definer set search_path = ''
as $$
declare
  current_task public.tasks;
  previous_status public.task_status;
  is_responsible boolean;
  is_lead boolean := private.is_communication_lead();
  is_owner boolean;
begin
  select * into current_task from public.tasks where id = target_task_id for update;
  if not found then raise exception 'A feladat nem található.' using errcode = 'P0002'; end if;
  if not private.is_active_user() or private.is_technical_admin() then
    raise exception 'Nincs jogosultság.' using errcode = '42501';
  end if;
  previous_status := current_task.status;
  is_responsible := current_task.responsible_user_id = auth.uid();
  is_owner := current_task.project_id is not null and private.is_project_owner(current_task.project_id);
  if previous_status = target_status then raise exception 'Az állapot nem változott.' using errcode = '22023'; end if;

  if previous_status = 'draft' and target_status = 'assigned'
    and (current_task.created_by = auth.uid() or is_owner or is_lead) then
    current_task.acceptance_status := 'pending';
  elsif previous_status = 'assigned' and target_status = 'accepted' and is_responsible then
    current_task.acceptance_status := 'accepted';
  elsif previous_status = 'assigned' and target_status = 'clarification_needed' and is_responsible
    and nullif(btrim(transition_reason), '') is not null then
    current_task.acceptance_status := 'clarification_requested';
  elsif previous_status = 'assigned' and target_status = 'blocked' and is_responsible
    and nullif(btrim(transition_reason), '') is not null then
    current_task.acceptance_status := 'obstacle_reported';
  elsif previous_status = 'accepted' and target_status = 'in_progress' and is_responsible then
    if current_task.is_publication_required and current_task.due_at is null then
      raise exception 'Publikációs feladat határidő nélkül nem indítható.' using errcode = '23514';
    end if;
    current_task.started_at := coalesce(current_task.started_at, now());
  elsif previous_status = 'in_progress' and target_status = 'blocked'
    and (is_responsible or is_owner or is_lead) and nullif(btrim(transition_reason), '') is not null then null;
  elsif previous_status = 'in_progress' and target_status = 'clarification_needed'
    and is_responsible and nullif(btrim(transition_reason), '') is not null then null;
  elsif previous_status = 'in_progress' and target_status = 'in_review'
    and is_responsible and current_task.requires_review then null;
  elsif previous_status = 'in_progress' and target_status = 'completed'
    and is_responsible and not current_task.requires_review then
    current_task.completed_at := now(); current_task.completed_by := auth.uid();
  elsif previous_status = 'in_review' and target_status = 'completed'
    and (current_task.reviewer_user_id = auth.uid() or is_owner or is_lead) then
    current_task.completed_at := now(); current_task.completed_by := auth.uid();
  elsif previous_status = 'in_review' and target_status = 'in_progress'
    and (current_task.reviewer_user_id = auth.uid() or is_owner or is_lead)
    and nullif(btrim(transition_reason), '') is not null then null;
  elsif previous_status = 'clarification_needed' and target_status = 'assigned'
    and (current_task.created_by = auth.uid() or is_owner or is_lead)
    and nullif(btrim(transition_reason), '') is not null then
    current_task.acceptance_status := 'pending';
  elsif previous_status = 'blocked' and target_status in ('accepted', 'in_progress')
    and (is_owner or is_lead) and nullif(btrim(transition_reason), '') is not null
    and (new_due_at is not null or confirm_existing_due) then
    update public.task_block_details set resolved_at = now(), resolved_by = auth.uid(), resolution_note = transition_reason
    where task_id = target_task_id and resolved_at is null;
    current_task.acceptance_status := 'accepted';
  elsif previous_status = 'completed' and target_status = 'in_progress' and is_lead
    and nullif(btrim(transition_reason), '') is not null then
    current_task.completed_at := null; current_task.completed_by := null;
  elsif previous_status not in ('completed', 'withdrawn', 'archived') and target_status = 'withdrawn'
    and (current_task.created_by = auth.uid() or is_owner or is_lead)
    and nullif(btrim(transition_reason), '') is not null then
    current_task.withdrawn_at := now(); current_task.withdrawn_by := auth.uid();
  elsif previous_status in ('completed', 'withdrawn') and target_status = 'archived'
    and (is_owner or is_lead) then null;
  else
    raise exception 'Nem engedélyezett feladatállapot-átmenet.' using errcode = '23514';
  end if;

  if target_status = 'blocked' then
    insert into public.task_block_details(task_id, block_reason_code, details, started_at)
    values (target_task_id, 'other', btrim(transition_reason), now());
  end if;
  if new_due_at is not null and new_due_at is distinct from current_task.due_at then
    insert into public.task_deadline_history(task_id, old_due_at, new_due_at, reason, changed_by)
    values (target_task_id, current_task.due_at, new_due_at, transition_reason, auth.uid());
    current_task.due_at := new_due_at; current_task.unscheduled := false;
  end if;

  update public.tasks set
    status = target_status,
    acceptance_status = current_task.acceptance_status,
    started_at = current_task.started_at,
    completed_at = current_task.completed_at,
    completed_by = current_task.completed_by,
    withdrawn_at = current_task.withdrawn_at,
    withdrawn_by = current_task.withdrawn_by,
    due_at = current_task.due_at,
    unscheduled = current_task.unscheduled,
    updated_by = auth.uid()
  where id = target_task_id returning * into current_task;

  perform private.write_audit(
    'task.transitioned', 'task', current_task.id, current_task.project_id,
    jsonb_build_object('status', previous_status), jsonb_build_object('status', target_status), transition_reason
  );
  return current_task;
end;
$$;

create or replace function public.change_task_deadline(
  target_task_id uuid,
  target_due_at timestamptz,
  change_reason text
)
returns public.tasks
language plpgsql security definer set search_path = ''
as $$
declare current_task public.tasks;
begin
  select * into current_task from public.tasks where id = target_task_id for update;
  if not found then raise exception 'A feladat nem található.' using errcode = 'P0002'; end if;
  if not (
    current_task.responsible_user_id = auth.uid()
    or private.is_communication_lead()
    or (current_task.project_id is not null and private.is_project_owner(current_task.project_id))
  ) or nullif(btrim(change_reason), '') is null then
    raise exception 'A határidő módosításához jogosultság és indoklás szükséges.' using errcode = '42501';
  end if;
  if target_due_at is not null and target_due_at < now() and not private.is_communication_lead() then
    raise exception 'Visszamenőleges határidőt csak a kommunikációs vezető adhat.' using errcode = '42501';
  end if;
  if target_due_at is not distinct from current_task.due_at then
    raise exception 'A határidő nem változott.' using errcode = '22023';
  end if;
  insert into public.task_deadline_history(task_id, old_due_at, new_due_at, reason, changed_by)
  values (target_task_id, current_task.due_at, target_due_at, btrim(change_reason), auth.uid());
  update public.tasks set due_at = target_due_at, unscheduled = target_due_at is null, updated_by = auth.uid()
  where id = target_task_id returning * into current_task;
  perform private.write_audit('task.deadline_changed', 'task', current_task.id, current_task.project_id,
    null, jsonb_build_object('due_at', target_due_at), change_reason);
  return current_task;
end;
$$;

create or replace function public.schedule_event(
  target_event_id uuid,
  event_starts_at timestamptz,
  event_ends_at timestamptz,
  event_location_name text default null,
  event_location_address text default null,
  event_online_url text default null,
  event_is_mandatory boolean default false,
  event_response_due_at timestamptz default null
)
returns public.events
language plpgsql security definer set search_path = ''
as $$
declare current_event public.events;
declare previous_status public.event_status;
begin
  select * into current_event from public.events where id = target_event_id for update;
  if not found then raise exception 'Az esemény nem található.' using errcode = 'P0002'; end if;
  previous_status := current_event.status;
  if current_event.status not in ('draft', 'postponed') or not private.can_manage_event(target_event_id) then
    raise exception 'Az esemény nem ütemezhető.' using errcode = '42501';
  end if;
  if event_ends_at <= event_starts_at then
    raise exception 'Az esemény vége nem lehet korábbi a kezdeténél.' using errcode = '22023';
  end if;
  if nullif(btrim(event_location_name), '') is null and nullif(btrim(event_online_url), '') is null then
    raise exception 'Helyszín vagy online elérés szükséges.' using errcode = '22023';
  end if;
  if event_response_due_at is not null and event_response_due_at >= event_starts_at then
    raise exception 'A válaszadási határidőnek meg kell előznie az eseményt.' using errcode = '22023';
  end if;
  update public.events set
    starts_at = event_starts_at, ends_at = event_ends_at,
    location_name = nullif(btrim(event_location_name), ''),
    location_address = nullif(btrim(event_location_address), ''),
    online_url = nullif(btrim(event_online_url), ''),
    is_mandatory = event_is_mandatory, response_due_at = event_response_due_at,
    status = 'scheduled', postpone_reason = null, updated_by = auth.uid()
  where id = target_event_id returning * into current_event;
  insert into public.event_change_log(
    event_id, change_type, old_values, new_values, reason, requires_reconfirmation, changed_by
  ) values (
    target_event_id, 'scheduled', null,
    jsonb_build_object('starts_at', event_starts_at, 'ends_at', event_ends_at,
      'location_name', event_location_name, 'is_mandatory', event_is_mandatory),
    null, false, auth.uid()
  );
  perform private.write_audit('event.scheduled', 'event', current_event.id, current_event.project_id,
    jsonb_build_object('status', previous_status), jsonb_build_object('status', 'scheduled'), null);
  return current_event;
end;
$$;

create or replace function public.invite_event_user(
  target_event_id uuid,
  participant_user_id uuid,
  response_is_required boolean default true
)
returns public.event_participants
language plpgsql security definer set search_path = ''
as $$
declare participant public.event_participants;
begin
  if not private.can_manage_event(target_event_id) then
    raise exception 'Nincs jogosultság résztvevő meghívására.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = participant_user_id and p.account_status = 'active') then
    raise exception 'A résztvevő nem aktív felhasználó.' using errcode = '22023';
  end if;
  insert into public.event_participants(
    event_id, participant_type, user_id, status, response_required, invited_by
  ) values (
    target_event_id, 'user', participant_user_id,
    case when response_is_required then 'pending'::public.event_participant_status else 'no_response_required'::public.event_participant_status end,
    response_is_required, auth.uid()
  ) returning * into participant;
  perform private.write_audit('event.user_invited', 'event_participant', participant.id, null,
    null, jsonb_build_object('event_id', target_event_id, 'user_id', participant_user_id), null);
  return participant;
end;
$$;

create or replace function public.create_event(
  event_title text,
  event_kind public.event_type,
  event_responsible_user_id uuid,
  event_project_id uuid default null,
  event_description text default null
)
returns public.events
language plpgsql security definer set search_path = ''
as $$
declare created_event public.events;
begin
  if not private.is_active_user() or private.is_technical_admin() then
    raise exception 'Nincs jogosultság esemény létrehozására.' using errcode = '42501';
  end if;
  if event_project_id is null then
    if not (private.is_communication_lead() or event_responsible_user_id = auth.uid()) then
      raise exception 'Önálló esemény csak saját felelősséggel hozható létre.' using errcode = '42501';
    end if;
  elsif not (private.is_communication_lead() or private.is_project_owner(event_project_id)) then
    raise exception 'A projektben nincs eseménylétrehozási jogosultság.' using errcode = '42501';
  end if;
  if nullif(btrim(event_title), '') is null or char_length(btrim(event_title)) > 250 then
    raise exception 'Az esemény címe hibás.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles p where p.id = event_responsible_user_id and p.account_status = 'active') then
    raise exception 'A felelős nem aktív felhasználó.' using errcode = '22023';
  end if;
  insert into public.events(
    event_code, title, description, event_type, responsible_user_id, project_id, created_by, updated_by
  ) values (
    'RA-EVT-' || to_char(now() at time zone 'Europe/Budapest', 'YYYY') || '-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8)),
    btrim(event_title), event_description, event_kind, event_responsible_user_id, event_project_id, auth.uid(), auth.uid()
  ) returning * into created_event;
  perform private.write_audit('event.created', 'event', created_event.id, created_event.project_id,
    null, jsonb_build_object('status', created_event.status, 'responsible_user_id', created_event.responsible_user_id), null);
  return created_event;
end;
$$;

create or replace function public.respond_to_event(
  target_participant_id uuid,
  response public.event_participant_status
)
returns public.event_participants
language plpgsql security definer set search_path = ''
as $$
declare participant public.event_participants;
declare target_is_namesake boolean;
begin
  if not private.is_active_user() or private.is_technical_admin() then
    raise exception 'Nincs aktív felhasználói hozzáférés.' using errcode = '42501';
  end if;
  if response not in ('accepted', 'declined', 'maybe') then
    raise exception 'Érvénytelen részvételi válasz.' using errcode = '22023';
  end if;
  select * into participant from public.event_participants where id = target_participant_id for update;
  if not found then raise exception 'A meghívás nem található.' using errcode = 'P0002'; end if;
  select exists (
    select 1 from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = participant.user_id and r.code = 'namesake'
      and r.is_active and ura.revoked_at is null and ura.valid_from <= now()
      and (ura.valid_until is null or ura.valid_until > now())
  ) into target_is_namesake;
  if participant.user_id <> auth.uid() and not (private.is_communication_lead() and coalesce(target_is_namesake, false)) then
    raise exception 'Más meghívására nem válaszolhat.' using errcode = '42501';
  end if;
  if not participant.response_required then
    raise exception 'Ehhez a meghíváshoz nem szükséges válasz.' using errcode = '22023';
  end if;
  update public.event_participants set status = response, responded_at = now(), responded_by_user_id = auth.uid()
  where id = target_participant_id returning * into participant;
  perform private.write_audit('event.participant_responded', 'event_participant', participant.id, null,
    null, jsonb_build_object('status', response, 'responded_by_user_id', auth.uid()), null);
  return participant;
end;
$$;

revoke all on function public.create_task(text, uuid, uuid, text, timestamptz, public.priority_level, boolean, uuid, boolean, text) from public, anon;
grant execute on function public.create_task(text, uuid, uuid, text, timestamptz, public.priority_level, boolean, uuid, boolean, text) to authenticated;
revoke all on function public.transition_task(uuid, public.task_status, text, timestamptz, boolean) from public, anon;
grant execute on function public.transition_task(uuid, public.task_status, text, timestamptz, boolean) to authenticated;
revoke all on function public.change_task_deadline(uuid, timestamptz, text) from public, anon;
grant execute on function public.change_task_deadline(uuid, timestamptz, text) to authenticated;
revoke all on function public.create_event(text, public.event_type, uuid, uuid, text) from public, anon;
grant execute on function public.create_event(text, public.event_type, uuid, uuid, text) to authenticated;
revoke all on function public.schedule_event(uuid, timestamptz, timestamptz, text, text, text, boolean, timestamptz) from public, anon;
grant execute on function public.schedule_event(uuid, timestamptz, timestamptz, text, text, text, boolean, timestamptz) to authenticated;
revoke all on function public.invite_event_user(uuid, uuid, boolean) from public, anon;
grant execute on function public.invite_event_user(uuid, uuid, boolean) to authenticated;
revoke all on function public.respond_to_event(uuid, public.event_participant_status) from public, anon;
grant execute on function public.respond_to_event(uuid, public.event_participant_status) to authenticated;

commit;
