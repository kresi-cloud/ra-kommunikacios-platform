begin;

-- I1/B3: értesítési outbox, tranzakciós értesítési események, időzített
-- eseménylezárás és Google busy-sync alap. Külső szolgáltató (e-mail, push)
-- nem kapcsolódik; a külső csatornák kézbesítési sorai 'queued' állapotban
-- várják a későbbi szerveroldali kézbesítőt.

create type public.notification_priority as enum ('normal', 'critical');
create type public.notification_read_status as enum ('unread', 'read');
create type public.notification_channel as enum ('in_app', 'email', 'push');
create type public.notification_delivery_status as enum ('queued', 'delivered', 'skipped', 'failed');
create type public.calendar_connection_status as enum ('connected', 'error', 'revoked');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete restrict,
  event_type text not null check (event_type ~ '^[a-z_]+\.[a-z_]+$'),
  title text not null check (char_length(title) between 1 and 250),
  body_safe text check (body_safe is null or char_length(body_safe) <= 2000),
  priority public.notification_priority not null default 'normal',
  entity_type text not null,
  entity_id uuid,
  project_id uuid,
  read_status public.notification_read_status not null default 'unread',
  read_at timestamptz,
  deliver_after timestamptz not null,
  archived_at timestamptz,
  retention_until timestamptz not null,
  group_key text,
  job_key text not null unique,
  created_at timestamptz not null default now(),
  constraint notification_read_shape check ((read_status = 'read') = (read_at is not null))
);

create index notifications_recipient_idx
  on public.notifications(recipient_user_id, read_status, archived_at, deliver_after);
create index notifications_entity_idx on public.notifications(entity_type, entity_id, created_at desc);
create index notifications_group_idx on public.notifications(group_key) where group_key is not null;
create index notifications_retention_idx on public.notifications(retention_until);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel public.notification_channel not null,
  status public.notification_delivery_status not null default 'queued',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  attempted_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  provider_message_id text,
  error_code text,
  created_at timestamptz not null default now(),
  unique (notification_id, channel)
);

create index notification_deliveries_queue_idx
  on public.notification_deliveries(channel, created_at) where status = 'queued';

create table public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type ~ '^[a-z_]+\.[a-z_]+$'),
  email_enabled boolean not null default true,
  push_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, event_type)
);

create table public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'google' check (provider = 'google'),
  calendar_display_name text,
  status public.calendar_connection_status not null default 'connected',
  last_sync_at timestamptz,
  sync_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  affected_rows integer not null default 0,
  error_message text
);

create index job_runs_name_idx on public.job_runs(job_name, started_at desc);

-- Google-forrású foglaltság: felhasználónként egy aktív sor egy külső hash-hez.
create unique index availability_google_hash_unique
  on public.availability_blocks(user_id, external_event_hash)
  where source = 'google' and cancelled_at is null;

create trigger calendar_connections_set_updated_at before update on public.calendar_connections
for each row execute function private.set_updated_at();

alter table public.notifications enable row level security;
alter table public.notifications force row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_deliveries force row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_preferences force row level security;
alter table public.calendar_connections enable row level security;
alter table public.calendar_connections force row level security;
alter table public.job_runs enable row level security;
alter table public.job_runs force row level security;

create policy notifications_read_own on public.notifications for select to authenticated
using (private.is_active_user() and recipient_user_id = auth.uid());

create policy notification_deliveries_read_own on public.notification_deliveries for select to authenticated
using (
  private.is_active_user() and exists (
    select 1 from public.notifications n
    where n.id = notification_id and n.recipient_user_id = auth.uid()
  )
);

create policy notification_preferences_read_own on public.notification_preferences for select to authenticated
using (private.is_active_user() and user_id = auth.uid());

create policy calendar_connections_read_own on public.calendar_connections for select to authenticated
using (private.is_active_user() and user_id = auth.uid());

create policy job_runs_read_operators on public.job_runs for select to authenticated
using (private.is_communication_lead() or private.is_technical_admin());

grant select on public.notifications, public.notification_deliveries, public.notification_preferences,
  public.calendar_connections, public.job_runs to authenticated;
revoke all on public.notifications, public.notification_deliveries, public.notification_preferences,
  public.calendar_connections, public.job_runs from anon;
revoke insert, update, delete on public.notifications, public.notification_deliveries,
  public.notification_preferences, public.calendar_connections, public.job_runs from authenticated;

-- ---------------------------------------------------------------------------
-- Segédfüggvények
-- ---------------------------------------------------------------------------

-- Normál értesítés külső kézbesítése csak 08:00–20:00 között (Europe/Budapest);
-- kritikus vagy azonnali jelölésű értesítés bármikor. A helyi 08:00 DST-helyes.
create or replace function private.budapest_delivery_time(
  created_at_value timestamptz,
  notification_priority public.notification_priority,
  deliver_immediately boolean default false
)
returns timestamptz language plpgsql stable security invoker set search_path = ''
as $$
declare
  local_time timestamp := created_at_value at time zone 'Europe/Budapest';
  local_hour integer := extract(hour from local_time)::integer;
begin
  if notification_priority = 'critical' or deliver_immediately then
    return created_at_value;
  end if;
  if local_hour >= 8 and local_hour < 20 then
    return created_at_value;
  end if;
  if local_hour < 8 then
    return (date_trunc('day', local_time) + interval '8 hours') at time zone 'Europe/Budapest';
  end if;
  return (date_trunc('day', local_time) + interval '1 day 8 hours') at time zone 'Europe/Budapest';
end;
$$;

-- Biztonsági, fiók-, jogosultsági, adatvédelmi és kritikus értesítés nem kapcsolható ki.
create or replace function private.is_mandatory_notification(
  notification_event_type text,
  notification_priority public.notification_priority
)
returns boolean language sql immutable security invoker set search_path = ''
as $$
  select notification_priority = 'critical'
    or split_part(notification_event_type, '.', 1) in ('security', 'account', 'permission', 'privacy')
$$;

create or replace function private.communication_lead_user_ids()
returns setof uuid language sql stable security definer set search_path = ''
as $$
  select distinct ura.user_id
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  join public.profiles p on p.id = ura.user_id
  where r.code = 'communication_lead' and r.is_active
    and ura.revoked_at is null and ura.valid_from <= now()
    and (ura.valid_until is null or ura.valid_until > now())
    and p.account_status = 'active'
$$;

create or replace function private.project_owner_user_id(target_project_id uuid)
returns uuid language sql stable security definer set search_path = ''
as $$
  select pr.owner_user_id from public.projects pr where pr.id = target_project_id
$$;

create or replace function private.format_budapest(value timestamptz)
returns text language sql stable security invoker set search_path = ''
as $$
  select case when value is null then 'nincs megadva'
    else to_char(value at time zone 'Europe/Budapest', 'YYYY. MM. DD. HH24:MI') end
$$;

-- Az outbox központi beírója. Idempotens a job_key alapján; a kezdeményezőt
-- alapból nem értesíti saját műveletéről; inaktív címzettet kihagy.
-- Az alkalmazáson belüli csatorna azonnal kézbesítettnek számít, az e-mail és
-- push sorok a felhasználói beállítás szerint 'queued' vagy 'skipped' állapotot kapnak.
create or replace function private.enqueue_notification(
  recipient uuid,
  notification_event_type text,
  notification_title text,
  notification_body text,
  notification_priority public.notification_priority,
  target_entity_type text,
  target_entity_id uuid,
  target_project_id uuid,
  idempotency_key text,
  deliver_immediately boolean default false,
  groupable boolean default false,
  skip_actor boolean default true
)
returns uuid language plpgsql volatile security definer set search_path = ''
as $$
declare
  created_at_value timestamptz := now();
  deliver_after_value timestamptz;
  notification_id uuid;
  email_pref boolean;
  push_pref boolean;
begin
  if recipient is null then return null; end if;
  if skip_actor and recipient = auth.uid() then return null; end if;
  if not private.is_active_user(recipient) then return null; end if;

  deliver_after_value := private.budapest_delivery_time(created_at_value, notification_priority, deliver_immediately);

  insert into public.notifications(
    recipient_user_id, event_type, title, body_safe, priority, entity_type, entity_id,
    project_id, deliver_after, retention_until, group_key, job_key, created_at
  ) values (
    recipient, notification_event_type, left(btrim(notification_title), 250),
    nullif(left(btrim(coalesce(notification_body, '')), 2000), ''), notification_priority,
    target_entity_type, target_entity_id, target_project_id,
    deliver_after_value, created_at_value + interval '1 year',
    case when groupable and notification_priority = 'normal' then
      recipient::text || ':' || target_entity_type || ':' || coalesce(target_entity_id::text, '-')
        || ':' || split_part(notification_event_type, '.', 1)
        || ':' || to_char(deliver_after_value at time zone 'UTC', 'YYYY-MM-DD-HH24')
    end,
    idempotency_key, created_at_value
  )
  on conflict (job_key) do nothing
  returning id into notification_id;

  if notification_id is null then return null; end if;

  if not private.is_mandatory_notification(notification_event_type, notification_priority) then
    select np.email_enabled, np.push_enabled into email_pref, push_pref
    from public.notification_preferences np
    where np.user_id = recipient and np.event_type = notification_event_type;
  end if;

  insert into public.notification_deliveries(
    notification_id, channel, status, attempt_count, attempted_at, delivered_at
  ) values (notification_id, 'in_app', 'delivered', 1, created_at_value, created_at_value);
  insert into public.notification_deliveries(notification_id, channel, status) values
    (notification_id, 'email', case when coalesce(email_pref, true) then 'queued'::public.notification_delivery_status else 'skipped'::public.notification_delivery_status end),
    (notification_id, 'push', case when coalesce(push_pref, true) then 'queued'::public.notification_delivery_status else 'skipped'::public.notification_delivery_status end);

  return notification_id;
end;
$$;

create or replace function private.notify_task(
  target_task public.tasks,
  recipient uuid,
  notification_event_type text,
  notification_title text,
  notification_body text,
  audit_id uuid,
  deliver_immediately boolean default false,
  groupable boolean default false
)
returns uuid language sql volatile security definer set search_path = ''
as $$
  select private.enqueue_notification(
    recipient, notification_event_type, notification_title, notification_body,
    (target_task).priority::text::public.notification_priority, 'task', (target_task).id, (target_task).project_id,
    notification_event_type || ':' || (target_task).id::text || ':' || recipient::text || ':' || audit_id::text,
    deliver_immediately, groupable, true
  )
$$;

create or replace function private.notify_event(
  target_event public.events,
  recipient uuid,
  notification_event_type text,
  notification_title text,
  notification_body text,
  audit_id uuid,
  deliver_immediately boolean default false,
  groupable boolean default false
)
returns uuid language sql volatile security definer set search_path = ''
as $$
  select private.enqueue_notification(
    recipient, notification_event_type, notification_title, notification_body,
    'normal', 'event', (target_event).id, (target_event).project_id,
    notification_event_type || ':' || (target_event).id::text || ':' || recipient::text || ':' || audit_id::text,
    deliver_immediately, groupable, true
  )
$$;

create or replace function private.notify_event_participants(
  target_event public.events,
  notification_event_type text,
  notification_title text,
  notification_body text,
  audit_id uuid,
  deliver_immediately boolean default false,
  groupable boolean default false
)
returns integer language plpgsql volatile security definer set search_path = ''
as $$
declare participant_user_id uuid; created integer := 0;
begin
  for participant_user_id in
    select ep.user_id from public.event_participants ep
    where ep.event_id = target_event.id and ep.user_id is not null
    union
    select target_event.responsible_user_id
  loop
    if private.notify_event(
      target_event, participant_user_id, notification_event_type, notification_title,
      notification_body, audit_id, deliver_immediately, groupable
    ) is not null then
      created := created + 1;
    end if;
  end loop;
  return created;
end;
$$;

-- ---------------------------------------------------------------------------
-- Feladat-RPC-k tranzakciós értesítéssel (változatlan aláírással)
-- ---------------------------------------------------------------------------

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
  audit_id uuid;
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
    'RA-TASK-' || to_char(now() at time zone 'Europe/Budapest', 'YYYY') || '-' || upper(substr(encode(public.gen_random_bytes(5), 'hex'), 1, 8)),
    normalized_title, task_description, task_responsible_user_id, task_project_id,
    case when assign_immediately then 'assigned'::public.task_status else 'draft'::public.task_status end,
    case when assign_immediately then 'pending'::public.task_acceptance_status else 'not_requested'::public.task_acceptance_status end,
    task_priority, task_due_at, task_due_at is null, task_requires_review,
    task_reviewer_user_id, auth.uid(), auth.uid()
  ) returning * into created_task;

  insert into public.task_assignments_history(task_id, from_user_id, to_user_id, reason, changed_by)
  values (created_task.id, null, task_responsible_user_id, 'Első kijelölés', auth.uid());
  audit_id := private.write_audit(
    'task.created', 'task', created_task.id, created_task.project_id, null,
    jsonb_build_object('status', created_task.status, 'responsible_user_id', created_task.responsible_user_id,
      'priority', created_task.priority, 'critical_reason', critical_reason), null
  );
  if assign_immediately then
    perform private.notify_task(
      created_task, created_task.responsible_user_id, 'task.assigned',
      'Új feladat: ' || created_task.title,
      'Kiosztottak neked egy feladatot. Határidő: ' || private.format_budapest(created_task.due_at) || '. Kérjük, igazold vissza.',
      audit_id, false, false
    );
  end if;
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
  audit_id uuid;
  owner_id uuid;
  lead_id uuid;
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

  audit_id := private.write_audit(
    'task.transitioned', 'task', current_task.id, current_task.project_id,
    jsonb_build_object('status', previous_status), jsonb_build_object('status', target_status), transition_reason
  );

  -- Értesítési események az állapotátmeneti mátrix 5. fejezete szerint.
  owner_id := private.project_owner_user_id(current_task.project_id);
  if target_status = 'assigned' then
    perform private.notify_task(current_task, current_task.responsible_user_id, 'task.assigned',
      'Új feladat: ' || current_task.title,
      'Kiosztottak neked egy feladatot. Határidő: ' || private.format_budapest(current_task.due_at) || '. Kérjük, igazold vissza.',
      audit_id, false, false);
  elsif target_status = 'accepted' and previous_status = 'assigned' then
    perform private.notify_task(current_task, current_task.created_by, 'task.accepted',
      'Elfogadott feladat: ' || current_task.title, 'A felelős visszaigazolta a feladatot.', audit_id, false, true);
    perform private.notify_task(current_task, owner_id, 'task.accepted',
      'Elfogadott feladat: ' || current_task.title, 'A felelős visszaigazolta a feladatot.', audit_id, false, true);
  elsif target_status = 'clarification_needed' then
    perform private.notify_task(current_task, current_task.created_by, 'task.clarification_requested',
      'Pontosítást kér: ' || current_task.title, 'A felelős pontosítást kér a feladathoz.', audit_id, true, false);
    perform private.notify_task(current_task, owner_id, 'task.clarification_requested',
      'Pontosítást kér: ' || current_task.title, 'A felelős pontosítást kér a feladathoz.', audit_id, true, false);
  elsif target_status = 'blocked' then
    perform private.notify_task(current_task, coalesce(owner_id, current_task.created_by), 'task.blocked',
      'Blokkolt feladat: ' || current_task.title, 'A feladat akadályba ütközött, döntés szükséges.', audit_id, true, false);
    if current_task.priority = 'critical' then
      for lead_id in select * from private.communication_lead_user_ids() loop
        perform private.notify_task(current_task, lead_id, 'task.blocked',
          'Blokkolt kritikus feladat: ' || current_task.title, 'Kritikus feladat akadályba ütközött.', audit_id, true, false);
      end loop;
    end if;
  elsif target_status = 'in_review' then
    perform private.notify_task(current_task, current_task.reviewer_user_id, 'task.review_requested',
      'Felülvizsgálatra vár: ' || current_task.title, 'A felelős felülvizsgálatra átadta a feladatot.', audit_id, true, false);
  elsif target_status = 'in_progress' and previous_status = 'in_review' then
    perform private.notify_task(current_task, current_task.responsible_user_id, 'task.returned',
      'Javításra visszaadva: ' || current_task.title, 'A felülvizsgáló javítást kért.', audit_id, true, false);
  elsif target_status = 'in_progress' and previous_status = 'completed' then
    perform private.notify_task(current_task, current_task.responsible_user_id, 'task.reopened',
      'Újranyitott feladat: ' || current_task.title, 'A kommunikációs vezető újranyitotta a feladatot.', audit_id, false, false);
  elsif previous_status = 'blocked' and target_status in ('accepted', 'in_progress') then
    perform private.notify_task(current_task, current_task.responsible_user_id, 'task.unblocked',
      'Feloldott feladat: ' || current_task.title,
      'A blokk feloldva. Határidő: ' || private.format_budapest(current_task.due_at) || '.', audit_id, false, false);
  elsif target_status = 'completed' then
    if previous_status = 'in_review' then
      perform private.notify_task(current_task, current_task.responsible_user_id, 'task.completed',
        'Elfogadott eredmény: ' || current_task.title, 'A felülvizsgáló elfogadta a feladat eredményét.', audit_id, false, true);
    end if;
    perform private.notify_task(current_task, owner_id, 'task.completed',
      'Befejezett feladat: ' || current_task.title, 'A feladat befejeződött.', audit_id, false, true);
  elsif target_status = 'withdrawn' then
    perform private.notify_task(current_task, current_task.responsible_user_id, 'task.withdrawn',
      'Visszavont feladat: ' || current_task.title, 'A feladatot visszavonták.', audit_id, true, false);
  end if;
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
declare
  current_task public.tasks;
  previous_due_at timestamptz;
  audit_id uuid;
  lead_id uuid;
  body text;
begin
  select * into current_task from public.tasks where id = target_task_id for update;
  if not found then raise exception 'A feladat nem található.' using errcode = 'P0002'; end if;
  if not private.is_active_user() or private.is_technical_admin()
    or current_task.status in ('completed', 'withdrawn', 'archived')
    or not (
      current_task.responsible_user_id = auth.uid()
      or private.is_communication_lead()
      or (current_task.project_id is not null and private.is_project_owner(current_task.project_id))
    ) then
    raise exception 'Nincs jogosultság a határidő módosításához.' using errcode = '42501';
  end if;
  if nullif(btrim(change_reason), '') is null then
    raise exception 'A határidő módosításához indoklás szükséges.' using errcode = '22023';
  end if;
  if target_due_at is not null and target_due_at < now() and not private.is_communication_lead() then
    raise exception 'Visszamenőleges határidőt csak a kommunikációs vezető adhat.' using errcode = '42501';
  end if;
  if target_due_at is not distinct from current_task.due_at then
    raise exception 'A határidő nem változott.' using errcode = '22023';
  end if;
  previous_due_at := current_task.due_at;
  insert into public.task_deadline_history(task_id, old_due_at, new_due_at, reason, changed_by)
  values (target_task_id, current_task.due_at, target_due_at, btrim(change_reason), auth.uid());
  update public.tasks set due_at = target_due_at, unscheduled = target_due_at is null, updated_by = auth.uid()
  where id = target_task_id returning * into current_task;
  audit_id := private.write_audit(
    'task.deadline_changed', 'task', current_task.id, current_task.project_id,
    jsonb_build_object('due_at', previous_due_at),
    jsonb_build_object('due_at', target_due_at), change_reason
  );

  body := 'Korábbi határidő: ' || private.format_budapest(previous_due_at)
    || '. Új határidő: ' || private.format_budapest(target_due_at) || '.';
  perform private.notify_task(current_task, current_task.responsible_user_id, 'task.deadline_changed',
    'Módosult határidő: ' || current_task.title, body, audit_id, false, false);
  perform private.notify_task(current_task, private.project_owner_user_id(current_task.project_id), 'task.deadline_changed',
    'Módosult határidő: ' || current_task.title, body, audit_id, false, false);
  if current_task.priority = 'critical' then
    for lead_id in select * from private.communication_lead_user_ids() loop
      perform private.notify_task(current_task, lead_id, 'task.deadline_changed',
        'Módosult határidő (kritikus): ' || current_task.title, body, audit_id, false, false);
    end loop;
  end if;
  return current_task;
end;
$$;

create or replace function public.reassign_task(
  target_task_id uuid,
  new_responsible_user_id uuid,
  transfer_reason text
)
returns public.tasks
language plpgsql security definer set search_path = ''
as $$
declare
  current_task public.tasks;
  previous_responsible_user_id uuid;
  is_owner boolean;
  audit_id uuid;
begin
  select * into current_task from public.tasks where id = target_task_id for update;
  if not found then raise exception 'A feladat nem található.' using errcode = 'P0002'; end if;
  is_owner := current_task.project_id is not null and private.is_project_owner(current_task.project_id);
  if not private.is_active_user() or private.is_technical_admin()
    or not (
      current_task.responsible_user_id = auth.uid()
      or current_task.created_by = auth.uid()
      or is_owner
      or private.is_communication_lead()
    ) then
    raise exception 'Nincs jogosultság a feladat átadására.' using errcode = '42501';
  end if;
  if current_task.status in ('completed', 'withdrawn', 'archived', 'blocked') then
    raise exception 'Ebben az állapotban a feladat nem adható át.' using errcode = '23514';
  end if;
  if nullif(btrim(transfer_reason), '') is null then
    raise exception 'A feladat átadásához indoklás szükséges.' using errcode = '22023';
  end if;
  if new_responsible_user_id = current_task.responsible_user_id then
    raise exception 'A felelős nem változott.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = new_responsible_user_id
      and p.account_status = 'active'
      and (p.is_internal_member or p.external_expires_at > now())
      and not exists (
        select 1 from public.user_role_assignments ura
        join public.roles r on r.id = ura.role_id
        where ura.user_id = p.id and r.code = 'technical_admin' and r.is_active
          and ura.revoked_at is null and ura.valid_from <= now()
          and (ura.valid_until is null or ura.valid_until > now())
      )
  ) then
    raise exception 'Az új felelős nem aktív, kijelölhető felhasználó.' using errcode = '22023';
  end if;

  previous_responsible_user_id := current_task.responsible_user_id;
  insert into public.task_assignments_history(task_id, from_user_id, to_user_id, reason, changed_by)
  values (target_task_id, previous_responsible_user_id, new_responsible_user_id, btrim(transfer_reason), auth.uid());

  update public.tasks set
    responsible_user_id = new_responsible_user_id,
    status = 'assigned',
    acceptance_status = 'pending',
    started_at = null,
    completed_at = null,
    completed_by = null,
    updated_by = auth.uid()
  where id = target_task_id returning * into current_task;

  audit_id := private.write_audit(
    'task.reassigned', 'task', current_task.id, current_task.project_id,
    jsonb_build_object('responsible_user_id', previous_responsible_user_id),
    jsonb_build_object('responsible_user_id', new_responsible_user_id, 'status', 'assigned', 'acceptance_status', 'pending'),
    transfer_reason
  );

  perform private.notify_task(current_task, new_responsible_user_id, 'task.reassigned',
    'Átadott feladat: ' || current_task.title,
    'Neked adták át a feladatot. Határidő: ' || private.format_budapest(current_task.due_at) || '. Kérjük, igazold vissza.',
    audit_id, false, false);
  perform private.notify_task(current_task, previous_responsible_user_id, 'task.reassigned',
    'Átadott feladat: ' || current_task.title, 'A feladatot új felelős kapta.', audit_id, false, true);
  perform private.notify_task(current_task, private.project_owner_user_id(current_task.project_id), 'task.reassigned',
    'Átadott feladat: ' || current_task.title, 'A feladatot új felelős kapta.', audit_id, false, true);
  return current_task;
end;
$$;

-- ---------------------------------------------------------------------------
-- Esemény-RPC-k tranzakciós értesítéssel (változatlan aláírással)
-- ---------------------------------------------------------------------------

create or replace function public.invite_event_user(
  target_event_id uuid,
  participant_user_id uuid,
  response_is_required boolean default true
)
returns public.event_participants
language plpgsql security definer set search_path = ''
as $$
declare
  participant public.event_participants;
  current_event public.events;
  audit_id uuid;
begin
  if not private.can_manage_event(target_event_id) then
    raise exception 'Nincs jogosultság résztvevő meghívására.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = participant_user_id and p.account_status = 'active') then
    raise exception 'A résztvevő nem aktív felhasználó.' using errcode = '22023';
  end if;
  select * into current_event from public.events where id = target_event_id;
  insert into public.event_participants(
    event_id, participant_type, user_id, status, response_required, invited_by
  ) values (
    target_event_id, 'user', participant_user_id,
    case when response_is_required then 'pending'::public.event_participant_status else 'no_response_required'::public.event_participant_status end,
    response_is_required, auth.uid()
  ) returning * into participant;
  audit_id := private.write_audit('event.user_invited', 'event_participant', participant.id, null,
    null, jsonb_build_object('event_id', target_event_id, 'user_id', participant_user_id), null);
  perform private.notify_event(current_event, participant_user_id, 'event.invited',
    case when current_event.is_mandatory then 'Kötelező meghívás: ' else 'Meghívás: ' end || current_event.title,
    'Kezdés: ' || private.format_budapest(current_event.starts_at)
      || case when response_is_required then '. Kérjük, válaszolj a meghívásra.' else '.' end,
    audit_id, current_event.is_mandatory, false);
  return participant;
end;
$$;

create or replace function public.update_scheduled_event(
  target_event_id uuid,
  event_title text,
  event_description text,
  event_starts_at timestamptz,
  event_ends_at timestamptz,
  event_location_name text,
  event_online_url text,
  event_is_mandatory boolean,
  change_reason text
)
returns public.events
language plpgsql security definer set search_path = ''
as $$
declare
  current_event public.events;
  old_values jsonb;
  new_values jsonb;
  important_change boolean;
  conflict_count integer := 0;
  audit_id uuid;
begin
  select * into current_event from public.events where id = target_event_id for update;
  if not found then raise exception 'Az esemény nem található.' using errcode = 'P0002'; end if;
  if current_event.status <> 'scheduled' or not private.can_manage_event(target_event_id) then
    raise exception 'Az esemény nem módosítható.' using errcode = '42501';
  end if;
  if nullif(btrim(event_title), '') is null or char_length(btrim(event_title)) > 250 then
    raise exception 'Az esemény címe hibás.' using errcode = '22023';
  end if;
  if event_ends_at <= event_starts_at then
    raise exception 'Az esemény vége nem lehet korábbi a kezdeténél.' using errcode = '22023';
  end if;
  if nullif(btrim(event_location_name), '') is null and nullif(btrim(event_online_url), '') is null then
    raise exception 'Helyszín vagy online elérés szükséges.' using errcode = '22023';
  end if;

  important_change :=
    current_event.starts_at is distinct from event_starts_at
    or current_event.ends_at is distinct from event_ends_at
    or current_event.location_name is distinct from nullif(btrim(event_location_name), '')
    or current_event.online_url is distinct from nullif(btrim(event_online_url), '')
    or current_event.is_mandatory is distinct from event_is_mandatory;
  if important_change and nullif(btrim(change_reason), '') is null then
    raise exception 'A lényeges eseménymódosításhoz indoklás szükséges.' using errcode = '22023';
  end if;
  if not (
    current_event.title is distinct from btrim(event_title)
    or current_event.description is distinct from nullif(btrim(event_description), '')
    or important_change
  ) then
    raise exception 'Az esemény adatai nem változtak.' using errcode = '22023';
  end if;

  if event_is_mandatory and (
    current_event.starts_at is distinct from event_starts_at
    or current_event.ends_at is distinct from event_ends_at
  ) then
    conflict_count := public.count_event_conflicts(target_event_id, event_starts_at, event_ends_at);
    if conflict_count > 0 and nullif(btrim(change_reason), '') is null then
      raise exception 'Kötelező esemény ütközéséhez indoklás szükséges.' using errcode = '22023';
    end if;
  end if;

  old_values := jsonb_build_object(
    'title', current_event.title, 'description', current_event.description,
    'starts_at', current_event.starts_at, 'ends_at', current_event.ends_at,
    'location_name', current_event.location_name, 'online_url', current_event.online_url,
    'is_mandatory', current_event.is_mandatory
  );
  new_values := jsonb_build_object(
    'title', btrim(event_title), 'description', nullif(btrim(event_description), ''),
    'starts_at', event_starts_at, 'ends_at', event_ends_at,
    'location_name', nullif(btrim(event_location_name), ''),
    'online_url', nullif(btrim(event_online_url), ''), 'is_mandatory', event_is_mandatory
  );

  update public.events set
    title = btrim(event_title), description = nullif(btrim(event_description), ''),
    starts_at = event_starts_at, ends_at = event_ends_at,
    location_name = nullif(btrim(event_location_name), ''),
    online_url = nullif(btrim(event_online_url), ''),
    is_mandatory = event_is_mandatory, updated_by = auth.uid()
  where id = target_event_id returning * into current_event;

  if important_change then
    update public.event_participants set
      status = 'pending', responded_at = null, responded_by_user_id = null
    where event_id = target_event_id and response_required;
  end if;
  insert into public.event_change_log(
    event_id, change_type, old_values, new_values, reason, requires_reconfirmation, changed_by
  ) values (
    target_event_id, 'updated', old_values, new_values,
    nullif(btrim(change_reason), ''), important_change, auth.uid()
  );
  audit_id := private.write_audit(
    'event.updated', 'event', current_event.id, current_event.project_id,
    old_values, new_values, change_reason
  );

  if important_change then
    perform private.notify_event_participants(current_event, 'event.material_change',
      'Módosult esemény: ' || current_event.title,
      'Új időpont: ' || private.format_budapest(current_event.starts_at) || ' – '
        || private.format_budapest(current_event.ends_at)
        || coalesce('. Helyszín: ' || current_event.location_name, '')
        || '. Kérjük, válaszolj újra a meghívásra.',
      audit_id, true, false);
  else
    perform private.notify_event_participants(current_event, 'event.minor_change',
      'Frissült esemény: ' || current_event.title, 'Az esemény leírása vagy részletei frissültek.',
      audit_id, false, true);
  end if;
  return current_event;
end;
$$;

create or replace function public.cancel_scheduled_event(
  target_event_id uuid,
  cancellation_reason text
)
returns public.events
language plpgsql security definer set search_path = ''
as $$
declare current_event public.events; audit_id uuid;
begin
  select * into current_event from public.events where id = target_event_id for update;
  if not found then raise exception 'Az esemény nem található.' using errcode = 'P0002'; end if;
  if current_event.status <> 'scheduled' or not private.can_manage_event(target_event_id) then
    raise exception 'Az esemény nem mondható le.' using errcode = '42501';
  end if;
  if nullif(btrim(cancellation_reason), '') is null then
    raise exception 'A lemondáshoz indoklás szükséges.' using errcode = '22023';
  end if;

  update public.events set status = 'cancelled', cancel_reason = btrim(cancellation_reason),
    updated_by = auth.uid()
  where id = target_event_id returning * into current_event;
  insert into public.event_change_log(
    event_id, change_type, old_values, new_values, reason, requires_reconfirmation, changed_by
  ) values (
    target_event_id, 'cancelled', jsonb_build_object('status', 'scheduled'),
    jsonb_build_object('status', 'cancelled'), btrim(cancellation_reason), false, auth.uid()
  );
  audit_id := private.write_audit(
    'event.cancelled', 'event', current_event.id, current_event.project_id,
    jsonb_build_object('status', 'scheduled'), jsonb_build_object('status', 'cancelled'), cancellation_reason
  );
  perform private.notify_event_participants(current_event, 'event.cancelled',
    'Lemondott esemény: ' || current_event.title,
    'Az eseményt lemondták. Eredeti kezdés: ' || private.format_budapest(current_event.starts_at) || '.',
    audit_id, true, false);
  return current_event;
end;
$$;

create or replace function public.respond_to_event(
  target_participant_id uuid,
  response public.event_participant_status
)
returns public.event_participants
language plpgsql security definer set search_path = ''
as $$
declare
  participant public.event_participants;
  target_is_namesake boolean;
  current_event public.events;
  responder_name text;
  audit_id uuid;
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
  audit_id := private.write_audit('event.participant_responded', 'event_participant', participant.id, null,
    null, jsonb_build_object('status', response, 'responded_by_user_id', auth.uid()), null);

  select * into current_event from public.events where id = participant.event_id;
  select p.display_name into responder_name from public.profiles p where p.id = participant.user_id;
  perform private.notify_event(current_event, current_event.responsible_user_id, 'event.response',
    'Részvételi válasz: ' || current_event.title,
    coalesce(responder_name, 'Egy résztvevő') || ' válasza: '
      || case response when 'accepted' then 'elfogadta' when 'declined' then 'elutasította' else 'talán' end
      || case when participant.responded_by_user_id <> participant.user_id then ' (a kommunikációs vezető rögzítette)' else '' end
      || '.',
    audit_id, response = 'declined' and current_event.is_mandatory, response <> 'declined');
  return participant;
end;
$$;

-- ---------------------------------------------------------------------------
-- Felhasználói értesítési RPC-k
-- ---------------------------------------------------------------------------

create or replace function public.mark_notification_read(target_notification_id uuid)
returns public.notifications
language plpgsql security definer set search_path = ''
as $$
declare current_notification public.notifications;
begin
  if not private.is_active_user() then
    raise exception 'Nincs aktív felhasználói hozzáférés.' using errcode = '42501';
  end if;
  update public.notifications set read_status = 'read', read_at = coalesce(read_at, now())
  where id = target_notification_id and recipient_user_id = auth.uid()
  returning * into current_notification;
  if not found then raise exception 'Az értesítés nem található.' using errcode = 'P0002'; end if;
  update public.notification_deliveries set opened_at = coalesce(opened_at, now())
  where notification_id = current_notification.id and channel = 'in_app';
  return current_notification;
end;
$$;

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare affected_count integer;
begin
  if not private.is_active_user() then
    raise exception 'Nincs aktív felhasználói hozzáférés.' using errcode = '42501';
  end if;
  update public.notifications set read_status = 'read', read_at = now()
  where recipient_user_id = auth.uid() and read_status = 'unread' and archived_at is null;
  get diagnostics affected_count = row_count;
  update public.notification_deliveries d set opened_at = coalesce(d.opened_at, now())
  from public.notifications n
  where d.notification_id = n.id and d.channel = 'in_app'
    and n.recipient_user_id = auth.uid() and n.read_status = 'read';
  return affected_count;
end;
$$;

create or replace function public.count_unread_notifications()
returns integer
language sql stable security definer set search_path = ''
as $$
  select count(*)::integer from public.notifications n
  where n.recipient_user_id = auth.uid() and n.read_status = 'unread' and n.archived_at is null
    and private.is_active_user()
$$;

create or replace function public.set_notification_preference(
  target_event_type text,
  enable_email boolean,
  enable_push boolean
)
returns public.notification_preferences
language plpgsql security definer set search_path = ''
as $$
declare saved public.notification_preferences;
begin
  if not private.is_active_user() then
    raise exception 'Nincs aktív felhasználói hozzáférés.' using errcode = '42501';
  end if;
  if target_event_type !~ '^[a-z_]+\.[a-z_]+$' then
    raise exception 'Érvénytelen értesítéstípus.' using errcode = '22023';
  end if;
  if private.is_mandatory_notification(target_event_type, 'normal') and not (enable_email and enable_push) then
    raise exception 'A kötelező értesítés nem kapcsolható ki.' using errcode = '42501';
  end if;
  insert into public.notification_preferences(user_id, event_type, email_enabled, push_enabled)
  values (auth.uid(), target_event_type, enable_email, enable_push)
  on conflict (user_id, event_type) do update set
    email_enabled = excluded.email_enabled, push_enabled = excluded.push_enabled, updated_at = now()
  returning * into saved;
  perform private.write_audit('notification_preference.updated', 'notification_preference', auth.uid(), null,
    null, jsonb_build_object('event_type', target_event_type, 'email_enabled', enable_email, 'push_enabled', enable_push), null);
  return saved;
end;
$$;

-- A felhasználó saját Google-naptárkapcsolatát vonhatja vissza; a Google-forrású
-- foglaltsági sorok ilyenkor visszavonásra kerülnek.
create or replace function public.disconnect_google_calendar()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_active_user() then
    raise exception 'Nincs aktív felhasználói hozzáférés.' using errcode = '42501';
  end if;
  update public.calendar_connections set status = 'revoked', sync_error_code = null
  where user_id = auth.uid() and provider = 'google' and status <> 'revoked';
  if not found then
    raise exception 'Nincs aktív Google-naptárkapcsolat.' using errcode = 'P0002';
  end if;
  update public.availability_blocks set cancelled_at = now(), cancelled_by = auth.uid()
  where user_id = auth.uid() and source = 'google' and cancelled_at is null;
  perform private.write_audit('calendar_connection.revoked', 'calendar_connection', auth.uid(), null,
    jsonb_build_object('status', 'connected'), jsonb_build_object('status', 'revoked'), null);
end;
$$;

-- ---------------------------------------------------------------------------
-- Google busy-sync alap (szerveroldali szinkronizáló hívja, kliensnek nem elérhető)
-- ---------------------------------------------------------------------------

-- busy_slots: JSON-tömb {"starts_at","ends_at","hash"} elemekkel. Cím, résztvevő
-- és leírás nem kerül tárolásra. A hiányzó hash-ek aktív sorai visszavonódnak.
create or replace function private.sync_google_busy_blocks(
  target_user_id uuid,
  busy_slots jsonb,
  calendar_name text default null
)
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare inserted integer := 0;
begin
  if not private.is_active_user(target_user_id) then
    raise exception 'A célfelhasználó nem aktív.' using errcode = '22023';
  end if;
  if busy_slots is null or jsonb_typeof(busy_slots) <> 'array' then
    raise exception 'A foglaltsági lista hibás.' using errcode = '22023';
  end if;

  insert into public.calendar_connections(user_id, provider, calendar_display_name, status, last_sync_at, sync_error_code)
  values (target_user_id, 'google', calendar_name, 'connected', now(), null)
  on conflict (user_id, provider) do update set
    calendar_display_name = coalesce(excluded.calendar_display_name, public.calendar_connections.calendar_display_name),
    status = 'connected', last_sync_at = now(), sync_error_code = null;

  update public.availability_blocks ab set cancelled_at = now()
  where ab.user_id = target_user_id and ab.source = 'google' and ab.cancelled_at is null
    and ab.external_event_hash not in (
      select slot->>'hash' from jsonb_array_elements(busy_slots) slot where slot->>'hash' is not null
    );

  insert into public.availability_blocks(user_id, starts_at, ends_at, source, external_event_hash)
  select target_user_id, (slot->>'starts_at')::timestamptz, (slot->>'ends_at')::timestamptz, 'google', slot->>'hash'
  from jsonb_array_elements(busy_slots) slot
  where slot->>'hash' is not null
    and (slot->>'ends_at')::timestamptz > (slot->>'starts_at')::timestamptz
    and not exists (
      select 1 from public.availability_blocks existing
      where existing.user_id = target_user_id and existing.source = 'google'
        and existing.cancelled_at is null and existing.external_event_hash = slot->>'hash'
    );
  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

create or replace function private.record_google_sync_error(target_user_id uuid, error_code text)
returns void
language plpgsql volatile security definer set search_path = ''
as $$
begin
  insert into public.calendar_connections(user_id, provider, status, sync_error_code)
  values (target_user_id, 'google', 'error', left(coalesce(error_code, 'unknown'), 100))
  on conflict (user_id, provider) do update set
    status = case when public.calendar_connections.status = 'revoked' then 'revoked'::public.calendar_connection_status else 'error'::public.calendar_connection_status end,
    sync_error_code = excluded.sync_error_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ütemezett automatizmusok (A10–A13, A15, A20, A21); idempotens job_key-ekkel
-- ---------------------------------------------------------------------------

create or replace function private.run_task_deadline_notifications(reference_time timestamptz default now())
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare
  t record;
  created integer := 0;
  owner_id uuid;
  lead_id uuid;
  due_key text;
  priority_value public.notification_priority;
begin
  for t in
    select tk.* from public.tasks tk
    where tk.due_at is not null
      and tk.status not in ('draft', 'blocked', 'completed', 'withdrawn', 'archived')
      and tk.due_at - interval '24 hours' <= reference_time
  loop
    owner_id := private.project_owner_user_id(t.project_id);
    due_key := t.id::text || ':' || to_char(t.due_at at time zone 'UTC', 'YYYYMMDDHH24MISS');
    priority_value := t.priority::text::public.notification_priority;

    -- Emlékeztető csak akkor, ha a küszöb a feladat létrehozásakor még a jövőben volt;
    -- egyszerre csak a legszűkebb esedékes küszöb készül el (nincs duplikáció).
    if reference_time >= t.due_at - interval '2 hours' and reference_time < t.due_at
      and t.due_at - interval '2 hours' >= t.created_at then
      if private.enqueue_notification(t.responsible_user_id, 'task.reminder_2h',
        'Határidő 2 órán belül: ' || t.title, 'A feladat határideje: ' || private.format_budapest(t.due_at) || '.',
        priority_value, 'task', t.id, t.project_id, 'task.reminder_2h:' || due_key, false, false, false) is not null then
        created := created + 1;
      end if;
    elsif reference_time >= t.due_at - interval '24 hours' and reference_time < t.due_at - interval '2 hours'
      and t.due_at - interval '24 hours' >= t.created_at then
      if private.enqueue_notification(t.responsible_user_id, 'task.reminder_24h',
        'Határidő 24 órán belül: ' || t.title, 'A feladat határideje: ' || private.format_budapest(t.due_at) || '.',
        priority_value, 'task', t.id, t.project_id, 'task.reminder_24h:' || due_key, false, false, false) is not null then
        created := created + 1;
      end if;
    end if;

    if reference_time >= t.due_at then
      if private.enqueue_notification(t.responsible_user_id, 'task.due',
        'Esedékes feladat: ' || t.title, 'A feladat határideje elérkezett: ' || private.format_budapest(t.due_at) || '.',
        priority_value, 'task', t.id, t.project_id, 'task.due:' || due_key || ':' || t.responsible_user_id::text, false, false, false) is not null then
        created := created + 1;
      end if;
      if owner_id is not null and owner_id <> t.responsible_user_id and private.enqueue_notification(owner_id, 'task.due',
        'Esedékes feladat: ' || t.title, 'A feladat határideje elérkezett: ' || private.format_budapest(t.due_at) || '.',
        priority_value, 'task', t.id, t.project_id, 'task.due:' || due_key || ':' || owner_id::text, false, false, false) is not null then
        created := created + 1;
      end if;
    end if;

    if reference_time >= t.due_at + interval '24 hours' then
      if private.enqueue_notification(t.responsible_user_id, 'task.overdue',
        'Késedelmes feladat: ' || t.title, 'A feladat határideje több mint egy napja lejárt.',
        priority_value, 'task', t.id, t.project_id, 'task.overdue:' || due_key || ':' || t.responsible_user_id::text, false, false, false) is not null then
        created := created + 1;
      end if;
      if owner_id is not null and owner_id <> t.responsible_user_id and private.enqueue_notification(owner_id, 'task.overdue',
        'Késedelmes feladat: ' || t.title, 'A feladat határideje több mint egy napja lejárt.',
        priority_value, 'task', t.id, t.project_id, 'task.overdue:' || due_key || ':' || owner_id::text, false, false, false) is not null then
        created := created + 1;
      end if;
      if t.priority = 'critical' then
        for lead_id in select * from private.communication_lead_user_ids() loop
          if private.enqueue_notification(lead_id, 'task.overdue',
            'Késedelmes kritikus feladat: ' || t.title, 'Kritikus feladat határideje több mint egy napja lejárt.',
            priority_value, 'task', t.id, t.project_id, 'task.overdue:' || due_key || ':' || lead_id::text, false, false, false) is not null then
            created := created + 1;
          end if;
        end loop;
      end if;
    end if;
  end loop;
  return created;
end;
$$;

create or replace function private.close_occurred_events(reference_time timestamptz default now())
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare e public.events; closed integer := 0;
begin
  for e in
    select * from public.events
    where status = 'scheduled' and ends_at is not null and ends_at <= reference_time
    for update skip locked
  loop
    update public.events set status = 'occurred' where id = e.id returning * into e;
    insert into public.event_change_log(
      event_id, change_type, old_values, new_values, reason, requires_reconfirmation, changed_by
    ) values (
      e.id, 'occurred', jsonb_build_object('status', 'scheduled'),
      jsonb_build_object('status', 'occurred'), null, false, null
    );
    perform private.write_audit('event.occurred', 'event', e.id, e.project_id,
      jsonb_build_object('status', 'scheduled'), jsonb_build_object('status', 'occurred'), null);
    perform private.enqueue_notification(e.responsible_user_id, 'event.occurred',
      'Megtörtént esemény: ' || e.title,
      'Az esemény lezárult; a kimenet szükség esetén utólag módosítható.',
      'normal', 'event', e.id, e.project_id, 'event.occurred:' || e.id::text, false, true, false);
    closed := closed + 1;
  end loop;
  return closed;
end;
$$;

create or replace function private.archive_stale_notifications(reference_time timestamptz default now())
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare affected_count integer;
begin
  update public.notifications set archived_at = reference_time
  where archived_at is null
    and created_at <= reference_time - interval '7 days'
    and not (priority = 'critical' and read_status = 'unread');
  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

create or replace function private.purge_expired_notifications(reference_time timestamptz default now())
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare affected_count integer;
begin
  delete from public.notifications where retention_until <= reference_time;
  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

-- Egy futtatás minden háttérfeladatot lefuttat; a hibát feladatonként naplózza,
-- és nem gördíti vissza a többi feladatot.
create or replace function private.run_notification_jobs(reference_time timestamptz default now())
returns table(executed_job text, affected integer, run_status text)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  job text;
  run_id uuid;
  affected_count integer;
begin
  foreach job in array array[
    'close_occurred_events', 'run_task_deadline_notifications',
    'archive_stale_notifications', 'purge_expired_notifications'
  ] loop
    insert into public.job_runs(job_name) values (job) returning id into run_id;
    begin
      affected_count := case job
        when 'close_occurred_events' then private.close_occurred_events(reference_time)
        when 'run_task_deadline_notifications' then private.run_task_deadline_notifications(reference_time)
        when 'archive_stale_notifications' then private.archive_stale_notifications(reference_time)
        else private.purge_expired_notifications(reference_time)
      end;
      update public.job_runs set status = 'succeeded', affected_rows = affected_count, finished_at = now()
      where id = run_id;
      executed_job := job; affected := affected_count; run_status := 'succeeded';
    exception when others then
      update public.job_runs set status = 'failed', error_message = left(sqlerrm, 500), finished_at = now()
      where id = run_id;
      executed_job := job; affected := 0; run_status := 'failed';
    end;
    return next;
  end loop;
  return;
end;
$$;

-- ---------------------------------------------------------------------------
-- Jogosultságok
-- ---------------------------------------------------------------------------

revoke all on function private.budapest_delivery_time(timestamptz, public.notification_priority, boolean) from public, anon, authenticated;
revoke all on function private.is_mandatory_notification(text, public.notification_priority) from public, anon, authenticated;
revoke all on function private.communication_lead_user_ids() from public, anon, authenticated;
revoke all on function private.project_owner_user_id(uuid) from public, anon, authenticated;
revoke all on function private.format_budapest(timestamptz) from public, anon, authenticated;
revoke all on function private.enqueue_notification(uuid, text, text, text, public.notification_priority, text, uuid, uuid, text, boolean, boolean, boolean) from public, anon, authenticated;
revoke all on function private.notify_task(public.tasks, uuid, text, text, text, uuid, boolean, boolean) from public, anon, authenticated;
revoke all on function private.notify_event(public.events, uuid, text, text, text, uuid, boolean, boolean) from public, anon, authenticated;
revoke all on function private.notify_event_participants(public.events, text, text, text, uuid, boolean, boolean) from public, anon, authenticated;
revoke all on function private.sync_google_busy_blocks(uuid, jsonb, text) from public, anon, authenticated;
revoke all on function private.record_google_sync_error(uuid, text) from public, anon, authenticated;
revoke all on function private.run_task_deadline_notifications(timestamptz) from public, anon, authenticated;
revoke all on function private.close_occurred_events(timestamptz) from public, anon, authenticated;
revoke all on function private.archive_stale_notifications(timestamptz) from public, anon, authenticated;
revoke all on function private.purge_expired_notifications(timestamptz) from public, anon, authenticated;
revoke all on function private.run_notification_jobs(timestamptz) from public, anon, authenticated;

revoke all on function public.mark_notification_read(uuid) from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;
revoke all on function public.mark_all_notifications_read() from public, anon;
grant execute on function public.mark_all_notifications_read() to authenticated;
revoke all on function public.count_unread_notifications() from public, anon;
grant execute on function public.count_unread_notifications() to authenticated;
revoke all on function public.set_notification_preference(text, boolean, boolean) from public, anon;
grant execute on function public.set_notification_preference(text, boolean, boolean) to authenticated;
revoke all on function public.disconnect_google_calendar() from public, anon;
grant execute on function public.disconnect_google_calendar() to authenticated;

-- pg_cron ütemezés csak ott, ahol a bővítmény engedélyezett; máshol a runbook
-- szerinti külső ütemező hívja a private.run_notification_jobs() függvényt.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('ra-notification-jobs', '*/15 * * * *', 'select private.run_notification_jobs();');
  end if;
end;
$$;

commit;
