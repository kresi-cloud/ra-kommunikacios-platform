begin;

create or replace function public.get_task_capabilities(target_task_id uuid)
returns table(can_change_deadline boolean, can_reassign boolean)
language sql stable security definer set search_path = ''
as $$
  select
    private.is_active_user()
      and not private.is_technical_admin()
      and t.status not in ('completed', 'withdrawn', 'archived')
      and (
        t.responsible_user_id = auth.uid()
        or private.is_communication_lead()
        or (t.project_id is not null and private.is_project_owner(t.project_id))
      ),
    private.is_active_user()
      and not private.is_technical_admin()
      and t.status not in ('completed', 'withdrawn', 'archived', 'blocked')
      and (
        t.responsible_user_id = auth.uid()
        or t.created_by = auth.uid()
        or private.is_communication_lead()
        or (t.project_id is not null and private.is_project_owner(t.project_id))
      )
  from public.tasks t
  where t.id = target_task_id and private.can_access_task(t.id)
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

  perform private.write_audit(
    'task.reassigned', 'task', current_task.id, current_task.project_id,
    jsonb_build_object('responsible_user_id', previous_responsible_user_id),
    jsonb_build_object('responsible_user_id', new_responsible_user_id, 'status', 'assigned', 'acceptance_status', 'pending'),
    transfer_reason
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
declare
  current_task public.tasks;
  previous_due_at timestamptz;
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
  perform private.write_audit(
    'task.deadline_changed', 'task', current_task.id, current_task.project_id,
    jsonb_build_object('due_at', previous_due_at),
    jsonb_build_object('due_at', target_due_at), change_reason
  );
  return current_task;
end;
$$;

create or replace function public.get_event_capabilities(target_event_id uuid)
returns table(can_manage boolean)
language sql stable security definer set search_path = ''
as $$
  select private.can_manage_event(target_event_id)
  where private.can_access_event(target_event_id)
$$;

create or replace function public.count_event_conflicts(
  target_event_id uuid,
  candidate_starts_at timestamptz,
  candidate_ends_at timestamptz
)
returns integer
language plpgsql stable security definer set search_path = ''
as $$
declare conflict_count integer;
begin
  if not private.can_manage_event(target_event_id) then
    raise exception 'Nincs jogosultság az ütközésvizsgálathoz.' using errcode = '42501';
  end if;
  if candidate_ends_at <= candidate_starts_at then
    raise exception 'Az esemény vége nem lehet korábbi a kezdeténél.' using errcode = '22023';
  end if;

  with relevant_users as (
    select e.responsible_user_id as user_id from public.events e where e.id = target_event_id
    union
    select ep.user_id from public.event_participants ep
    where ep.event_id = target_event_id and ep.user_id is not null
  ), conflicting_slots as (
    select 'event'::text as source_kind, e.id as source_id
    from public.events e
    where e.id <> target_event_id and e.status = 'scheduled'
      and e.starts_at < candidate_ends_at and e.ends_at > candidate_starts_at
      and (
        e.responsible_user_id in (select user_id from relevant_users)
        or exists (
          select 1 from public.event_participants ep
          where ep.event_id = e.id and ep.user_id in (select user_id from relevant_users)
        )
      )
    union
    select 'availability', ab.id
    from public.availability_blocks ab
    where ab.cancelled_at is null
      and ab.user_id in (select user_id from relevant_users)
      and ab.starts_at < candidate_ends_at and ab.ends_at > candidate_starts_at
  )
  select count(*)::integer into conflict_count from conflicting_slots;
  return conflict_count;
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
  perform private.write_audit(
    'event.updated', 'event', current_event.id, current_event.project_id,
    old_values, new_values, change_reason
  );
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
declare current_event public.events;
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
  perform private.write_audit(
    'event.cancelled', 'event', current_event.id, current_event.project_id,
    jsonb_build_object('status', 'scheduled'), jsonb_build_object('status', 'cancelled'), cancellation_reason
  );
  return current_event;
end;
$$;

revoke all on function public.get_task_capabilities(uuid) from public, anon;
grant execute on function public.get_task_capabilities(uuid) to authenticated;
revoke all on function public.reassign_task(uuid, uuid, text) from public, anon;
grant execute on function public.reassign_task(uuid, uuid, text) to authenticated;
revoke all on function public.get_event_capabilities(uuid) from public, anon;
grant execute on function public.get_event_capabilities(uuid) to authenticated;
revoke all on function public.count_event_conflicts(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.count_event_conflicts(uuid, timestamptz, timestamptz) to authenticated;
revoke all on function public.update_scheduled_event(uuid, text, text, timestamptz, timestamptz, text, text, boolean, text) from public, anon;
grant execute on function public.update_scheduled_event(uuid, text, text, timestamptz, timestamptz, text, text, boolean, text) to authenticated;
revoke all on function public.cancel_scheduled_event(uuid, text) from public, anon;
grant execute on function public.cancel_scheduled_event(uuid, text) to authenticated;

commit;
