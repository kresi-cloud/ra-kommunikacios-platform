begin;

-- A security definer függvények üres search_path mellett futnak, ezért a
-- pgcrypto gen_random_bytes függvényét sémával minősítjük.
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
language plpgsql security definer set search_path = ''
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
    'RA-PROJ-' || to_char(now() at time zone 'Europe/Budapest', 'YYYY') || '-' || upper(substr(encode(public.gen_random_bytes(5), 'hex'), 1, 8)),
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
    'RA-TASK-' || to_char(now() at time zone 'Europe/Budapest', 'YYYY') || '-' || upper(substr(encode(public.gen_random_bytes(5), 'hex'), 1, 8)),
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
    'RA-EVT-' || to_char(now() at time zone 'Europe/Budapest', 'YYYY') || '-' || upper(substr(encode(public.gen_random_bytes(5), 'hex'), 1, 8)),
    btrim(event_title), event_description, event_kind, event_responsible_user_id, event_project_id, auth.uid(), auth.uid()
  ) returning * into created_event;
  perform private.write_audit('event.created', 'event', created_event.id, created_event.project_id,
    null, jsonb_build_object('status', created_event.status, 'responsible_user_id', created_event.responsible_user_id), null);
  return created_event;
end;
$$;

commit;
