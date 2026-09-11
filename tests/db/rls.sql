begin;

insert into auth.users(id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lead@example.test', '', now(), '{}', '{}', now(), now()),
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('30000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staff-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('30000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tech@example.test', '', now(), '{}', '{}', now(), now())
on conflict (id) do nothing;

insert into public.profiles(id, display_name, email, is_internal_member, account_status)
values
  ('30000000-0000-4000-8000-000000000001', 'Vezető Teszt', 'lead@example.test', true, 'active'),
  ('30000000-0000-4000-8000-000000000002', 'Projektgazda A', 'owner-a@example.test', true, 'active'),
  ('30000000-0000-4000-8000-000000000003', 'Munkatárs B', 'staff-b@example.test', true, 'active'),
  ('30000000-0000-4000-8000-000000000004', 'Technikai Admin', 'tech@example.test', true, 'active')
on conflict (id) do nothing;

insert into public.user_role_assignments(user_id, role_id, appointed_by, initiated_by, reason)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', 'DB-teszt'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-0000-0000-000000000003', '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', 'DB-teszt'),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-0000-0000-000000000002', '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', 'DB-teszt')
on conflict do nothing;

insert into public.projects(id, project_code, title, owner_user_id, created_by, updated_by)
values
  ('40000000-0000-4000-8000-000000000001', 'PROJECT-A', 'A projekt', '30000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001'),
  ('40000000-0000-4000-8000-000000000002', 'PROJECT-B', 'B projekt', '30000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.tasks(
  id, task_code, title, responsible_user_id, project_id, status, acceptance_status,
  priority, due_at, unscheduled, created_by, updated_by
) values
  ('50000000-0000-4000-8000-000000000001', 'TASK-A', 'A projekt feladata',
    '30000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001',
    'assigned', 'pending', 'normal', '2026-09-10T10:00:00Z', false,
    '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000002', 'TASK-B', 'B projekt feladata',
    '30000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000002',
    'assigned', 'pending', 'normal', null, true,
    '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.events(
  id, event_code, title, event_type, responsible_user_id, project_id,
  starts_at, ends_at, location_name, status, created_by, updated_by
) values
  ('60000000-0000-4000-8000-000000000001', 'EVENT-A', 'A projekt eseménye', 'press_event',
    '30000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001',
    '2026-09-12T08:00:00Z', '2026-09-12T10:00:00Z', 'Akadémia', 'scheduled',
    '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000002', 'EVENT-B', 'B projekt eseménye', 'meeting',
    '30000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000002',
    '2026-09-13T08:00:00Z', '2026-09-13T09:00:00Z', 'Tárgyaló', 'scheduled',
    '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000003', 'EVENT-C', 'Lezárandó esemény', 'meeting',
    '30000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001',
    '2026-09-01T08:00:00Z', '2026-09-01T09:00:00Z', 'Tárgyaló', 'scheduled',
    '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.event_participants(
  id, event_id, participant_type, user_id, status, response_required, invited_by
) values (
  '61000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001',
  'user', '30000000-0000-4000-8000-000000000003', 'pending', true,
  '30000000-0000-4000-8000-000000000001'
) on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);

do $$
begin
  if (select count(*) from public.projects) <> 1 then
    raise exception 'TC-RLS-002: a projektgazda nem pontosan a saját projektjét látja';
  end if;
  if exists (select 1 from public.projects where id = '40000000-0000-4000-8000-000000000002') then
    raise exception 'TC-RLS-002: idegen projekt kiszivárgott';
  end if;
  if (select count(*) from public.tasks) <> 1 then
    raise exception 'TC-RLS-TASK: a projektgazda nem pontosan a saját projektfeladatát látja';
  end if;
  if (select count(*) from public.events) <> 2 then
    raise exception 'TC-RLS-EVENT: a projektgazda nem pontosan a saját projekteseményeit látja';
  end if;
end;
$$;

select public.transition_task(
  '50000000-0000-4000-8000-000000000001', 'accepted', null, null, false
);
select public.create_availability_block('2026-09-15T08:00:00Z', '2026-09-15T10:00:00Z');
select public.create_task(
  'Létrehozási tesztfeladat', '30000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000001', null, null, 'normal', false, null, true, null
);
select public.create_scheduled_event(
  'Atomi tesztesemény', 'meeting', '30000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000001', null,
  '2026-09-16T08:00:00Z', '2026-09-16T09:00:00Z', 'Tárgyaló', null, null, false, null
);
do $$
begin
  if (select status from public.tasks where id = '50000000-0000-4000-8000-000000000001') <> 'accepted' then
    raise exception 'TC-TASK-003: a felelős elfogadása nem váltott állapotot';
  end if;
  begin
    update public.tasks set title = 'Tiltott közvetlen módosítás'
    where id = '50000000-0000-4000-8000-000000000001';
    raise exception 'TC-RLS-TASK-WRITE: közvetlen feladatmódosítás engedélyezett';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.availability_blocks) <> 1 then
    raise exception 'TC-AVL-001: a saját foglaltság nem olvasható';
  end if;
  if (select count(*) from public.events where title = 'Atomi tesztesemény' and status = 'scheduled') <> 1 then
    raise exception 'TC-EVT-CREATE: az atomi eseménylétrehozás nem ütemezett eseményt adott';
  end if;
  if (select count(*) from public.tasks where title = 'Létrehozási tesztfeladat' and status = 'assigned') <> 1 then
    raise exception 'TC-TASK-CREATE: a feladatlétrehozó RPC nem működik';
  end if;
  begin
    insert into public.availability_blocks(user_id, starts_at, ends_at)
    values ('30000000-0000-4000-8000-000000000002', now(), now() + interval '1 hour');
    raise exception 'TC-AVL-WRITE: közvetlen foglaltságírás engedélyezett';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
select public.respond_to_event(
  '61000000-0000-4000-8000-000000000001', 'accepted'
);
do $$
begin
  if (select status from public.event_participants where id = '61000000-0000-4000-8000-000000000001') <> 'accepted' then
    raise exception 'TC-EVT-003: a részvételi válasz nem maradt meg';
  end if;
  if exists (select 1 from public.availability_blocks) then
    raise exception 'TC-AVL-PRIVACY: más felhasználó foglaltsági sora közvetlenül látható';
  end if;
  if (select count(*) from public.list_busy_slots('2026-09-15T00:00:00Z', '2026-09-16T00:00:00Z')) <> 1 then
    raise exception 'TC-AVL-BUSY: a busy-only RPC nem adta vissza az idősávot';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);
do $$
begin
  begin
    perform public.change_task_deadline(
      '50000000-0000-4000-8000-000000000001', '2026-09-20T10:00:00Z', null
    );
    raise exception 'TC-TASK-006: a határidő indok nélkül módosult';
  exception when invalid_parameter_value or insufficient_privilege then null;
  end;
end;
$$;
select public.change_task_deadline(
  '50000000-0000-4000-8000-000000000001', '2026-09-20T10:00:00Z', 'Egyeztetett új határidő'
);
select public.reassign_task(
  '50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 'Kapacitás átrendezése'
);

select public.update_scheduled_event(
  '60000000-0000-4000-8000-000000000001', 'A projekt eseménye', 'Frissített leírás',
  '2026-09-12T08:00:00Z', '2026-09-12T10:00:00Z', 'Akadémia', null, false, null
);
do $$
begin
  if (select status from public.event_participants where id = '61000000-0000-4000-8000-000000000001') <> 'accepted' then
    raise exception 'TC-EVT-006: a leírásmódosítás törölte a részvételi választ';
  end if;
  if (select count(*) from public.task_deadline_history where task_id = '50000000-0000-4000-8000-000000000001' and reason = 'Egyeztetett új határidő') <> 1 then
    raise exception 'TC-TASK-007: a határidő-előzmény nem készült el';
  end if;
  if (select status from public.tasks where id = '50000000-0000-4000-8000-000000000001') <> 'assigned'
    or (select acceptance_status from public.tasks where id = '50000000-0000-4000-8000-000000000001') <> 'pending'
    or (select responsible_user_id from public.tasks where id = '50000000-0000-4000-8000-000000000001') <> '30000000-0000-4000-8000-000000000003' then
    raise exception 'TC-TASK-011: az átadás nem állította vissza a kiosztást és az elfogadást';
  end if;
  if (select count(*) from public.task_assignments_history where task_id = '50000000-0000-4000-8000-000000000001' and reason = 'Kapacitás átrendezése') <> 1 then
    raise exception 'TC-TASK-011: az átadási előzmény nem készült el';
  end if;
  if (select public.count_event_conflicts('60000000-0000-4000-8000-000000000001', '2026-09-15T08:30:00Z', '2026-09-15T09:30:00Z')) < 1 then
    raise exception 'TC-EVT-008: az ütközésvizsgálat nem jelezte a foglaltságot';
  end if;
  if not exists (
    select 1 from public.notifications
    where event_type = 'event.response' and entity_id = '60000000-0000-4000-8000-000000000001'
      and recipient_user_id = '30000000-0000-4000-8000-000000000002'
  ) then
    raise exception 'TC-EVT-003-NOT: a részvételi válasz nem értesítette az esemény felelősét';
  end if;
  if exists (select 1 from public.notifications where recipient_user_id <> auth.uid()) then
    raise exception 'TC-NOT-RLS: idegen értesítés látható';
  end if;
end;
$$;

select public.update_scheduled_event(
  '60000000-0000-4000-8000-000000000001', 'A projekt eseménye', 'Frissített leírás',
  '2026-09-15T08:30:00Z', '2026-09-15T09:30:00Z', 'Akadémia', null, true, 'Kiemelt közös időpont'
);
do $$
begin
  if (select status from public.event_participants where id = '61000000-0000-4000-8000-000000000001') <> 'pending' then
    raise exception 'TC-EVT-005: a lényeges módosítás nem kért új választ';
  end if;
  if not exists (
    select 1 from public.event_change_log
    where event_id = '60000000-0000-4000-8000-000000000001' and requires_reconfirmation
  ) then
    raise exception 'TC-EVT-005: az újravisszaigazolás nem került az eseménytörténetbe';
  end if;
  begin
    perform public.update_scheduled_event(
      '60000000-0000-4000-8000-000000000002', 'Tiltott módosítás', null,
      '2026-09-13T08:00:00Z', '2026-09-13T09:00:00Z', 'Tárgyaló', null, false, null
    );
    raise exception 'TC-EVT-AUTH: idegen esemény módosítható volt';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select public.cancel_scheduled_event(
  '60000000-0000-4000-8000-000000000001', 'A program elmarad'
);
do $$
begin
  if (select status from public.events where id = '60000000-0000-4000-8000-000000000001') <> 'cancelled' then
    raise exception 'TC-EVT-007: az esemény nem lemondott állapotú';
  end if;
end;
$$;

-- Értesítések a címzett (Munkatárs B) oldaláról
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000003', true);
do $$
declare
  reassigned_id uuid;
  unread_before integer;
  unread_after integer;
begin
  select id into reassigned_id from public.notifications
  where event_type = 'task.reassigned' and entity_id = '50000000-0000-4000-8000-000000000001'
    and recipient_user_id = '30000000-0000-4000-8000-000000000003';
  if reassigned_id is null then
    raise exception 'TC-TASK-011-NOT: az átadás nem értesítette az új felelőst';
  end if;
  if not exists (
    select 1 from public.notifications
    where event_type = 'event.material_change' and entity_id = '60000000-0000-4000-8000-000000000001'
      and deliver_after = created_at
  ) then
    raise exception 'TC-EVT-005-NOT: a lényeges eseménymódosítás nem azonnali értesítést adott';
  end if;
  if not exists (
    select 1 from public.notifications
    where event_type = 'event.cancelled' and entity_id = '60000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'TC-EVT-007-NOT: a lemondás nem értesítette a meghívottat';
  end if;
  if exists (select 1 from public.notifications where recipient_user_id <> auth.uid()) then
    raise exception 'TC-NOT-RLS: idegen értesítés látható';
  end if;
  if (select count(*) from public.notification_deliveries where notification_id = reassigned_id) <> 3 then
    raise exception 'TC-NOT-DELIVERY: hiányzik a csatornánkénti kézbesítési sor';
  end if;

  unread_before := public.count_unread_notifications();
  perform public.mark_notification_read(reassigned_id);
  unread_after := public.count_unread_notifications();
  if unread_after <> unread_before - 1
    or (select read_status from public.notifications where id = reassigned_id) <> 'read' then
    raise exception 'TC-NOT-READ: az olvasottá jelölés nem működik';
  end if;
  begin
    update public.notifications set read_status = 'read', read_at = now() where recipient_user_id = auth.uid();
    raise exception 'TC-NOT-WRITE: közvetlen értesítésírás engedélyezett';
  exception when insufficient_privilege then null;
  end;

  perform public.set_notification_preference('task.completed', false, true);
  if (select email_enabled from public.notification_preferences where event_type = 'task.completed') then
    raise exception 'TC-NOT-PREF: a normál értesítési beállítás nem mentődött';
  end if;
  begin
    perform public.set_notification_preference('security.login_failed', false, false);
    raise exception 'TC-NOT-010: kötelező értesítés kikapcsolható volt';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.disconnect_google_calendar();
    raise exception 'TC-INT-005: nem létező naptárkapcsolat visszavonható volt';
  exception when no_data_found then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
do $$
begin
  if not exists (
    select 1 from public.notifications
    where event_type = 'task.accepted' and entity_id = '50000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'TC-TASK-003-NOT: az elfogadás nem értesítette a kiosztót';
  end if;
end;
$$;
select public.create_project('Létrehozási tesztprojekt', '30000000-0000-4000-8000-000000000003');
select public.create_task(
  'Emlékeztető tesztfeladat', '30000000-0000-4000-8000-000000000003',
  '40000000-0000-4000-8000-000000000001', null, now() + interval '90 minutes', 'normal', false, null, true, null
);
do $$
begin
  if (select count(*) from public.projects where title = 'Létrehozási tesztprojekt') <> 1 then
    raise exception 'TC-PROJECT-CREATE: a projektlétrehozó RPC nem működik';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000004', true);
do $$
begin
  if exists (select 1 from public.projects) then
    raise exception 'TC-RLS-009: a technikai admin közvetlen projektadatot lát';
  end if;
  if exists (select 1 from public.tasks) or exists (select 1 from public.events) then
    raise exception 'TC-RLS-009B: a technikai admin feladatot vagy eseményt lát';
  end if;
  if exists (select 1 from public.notifications) then
    raise exception 'TC-RLS-009C: a technikai admin idegen értesítést lát';
  end if;
end;
$$;

-- Háttérfolyamatok rendszerkontextusban (nincs bejelentkezett felhasználó)
reset role;
select set_config('request.jwt.claim.sub', '', true);
do $$
declare
  reminder_task_id uuid;
  first_run integer;
  second_run integer;
  stale_id uuid;
  critical_id uuid;
  reference_time timestamptz := now();
begin
  first_run := private.close_occurred_events('2026-09-02T00:00:00Z');
  if (select status from public.events where id = '60000000-0000-4000-8000-000000000003') <> 'occurred' then
    raise exception 'TC-EVT-OCCURRED: a lejárt ütemezett esemény nem került Megtörtént állapotba';
  end if;
  second_run := private.close_occurred_events('2026-09-02T00:00:00Z');
  if second_run <> 0 or (
    select count(*) from public.notifications
    where event_type = 'event.occurred' and entity_id = '60000000-0000-4000-8000-000000000003'
  ) <> 1 then
    raise exception 'TC-INT-006: az ismételt eseménylezárás nem idempotens';
  end if;

  if private.budapest_delivery_time('2026-09-10T17:30:00Z', 'normal', false) <> '2026-09-10T17:30:00Z' then
    raise exception 'TC-NOT-001: a 19:30-as normál értesítés nem azonnali';
  end if;
  if private.budapest_delivery_time('2026-09-10T18:01:00Z', 'normal', false) <> '2026-09-11T06:00:00Z' then
    raise exception 'TC-NOT-002: a 20:01-es normál értesítés nem a következő 08:00-ra halasztódik';
  end if;
  if private.budapest_delivery_time('2026-09-11T00:00:00Z', 'critical', false) <> '2026-09-11T00:00:00Z' then
    raise exception 'TC-NOT-003: a kritikus értesítés nem azonnali';
  end if;
  if private.budapest_delivery_time('2026-10-24T20:30:00Z', 'normal', false) <> '2026-10-25T07:00:00Z' then
    raise exception 'TC-NOT-013: az óraátállítás után a helyi 08:00 hibás';
  end if;

  select id into reminder_task_id from public.tasks where title = 'Emlékeztető tesztfeladat';
  if reminder_task_id is null then
    raise exception 'TC-NOT-006: hiányzik az emlékeztető tesztfeladat';
  end if;
  first_run := private.run_task_deadline_notifications(reference_time);
  if exists (select 1 from public.notifications where event_type = 'task.reminder_24h' and entity_id = reminder_task_id) then
    raise exception 'TC-NOT-006: 24 órás emlékeztető készült egy 90 perces feladathoz';
  end if;
  if (select count(*) from public.notifications where event_type = 'task.reminder_2h' and entity_id = reminder_task_id) <> 1 then
    raise exception 'TC-NOT-006: a 2 órás emlékeztető hiányzik';
  end if;
  second_run := private.run_task_deadline_notifications(reference_time);
  if second_run <> 0 then
    raise exception 'TC-NOT-007: az ismételt futás duplikált értesítést adott';
  end if;
  perform private.run_task_deadline_notifications(reference_time + interval '2 hours');
  if (select count(*) from public.notifications where event_type = 'task.due' and entity_id = reminder_task_id) <> 2 then
    raise exception 'TC-NOT-DUE: az esedékességi értesítés nem jutott el a felelősnek és a projektgazdának';
  end if;

  stale_id := private.enqueue_notification(
    '30000000-0000-4000-8000-000000000003', 'task.completed', 'Régi normál értesítés', null,
    'normal', 'task', reminder_task_id, '40000000-0000-4000-8000-000000000001', 'db-test:stale', false, false, false
  );
  critical_id := private.enqueue_notification(
    '30000000-0000-4000-8000-000000000003', 'task.blocked', 'Régi kritikus értesítés', null,
    'critical', 'task', reminder_task_id, '40000000-0000-4000-8000-000000000001', 'db-test:critical', false, false, false
  );
  if stale_id is null or critical_id is null then
    raise exception 'TC-NOT-ENQUEUE: a rendszerkontextusú beírás nem működik';
  end if;
  if (select status from public.notification_deliveries where notification_id = stale_id and channel = 'email') <> 'skipped'
    or (select status from public.notification_deliveries where notification_id = stale_id and channel = 'push') <> 'queued' then
    raise exception 'TC-NOT-PREF-DELIVERY: a felhasználói beállítás nem érvényesült a külső csatornán';
  end if;
  update public.notifications set created_at = now() - interval '8 days' where id in (stale_id, critical_id);
  perform private.archive_stale_notifications(now());
  if (select archived_at from public.notifications where id = stale_id) is null then
    raise exception 'TC-NOT-008: a 7 napos normál értesítés nem archiválódott';
  end if;
  if (select archived_at from public.notifications where id = critical_id) is not null then
    raise exception 'TC-NOT-009: a kritikus olvasatlan értesítés archiválódott';
  end if;

  perform private.sync_google_busy_blocks(
    '30000000-0000-4000-8000-000000000003',
    '[{"starts_at":"2026-09-18T08:00:00Z","ends_at":"2026-09-18T09:00:00Z","hash":"h1"},{"starts_at":"2026-09-18T10:00:00Z","ends_at":"2026-09-18T11:00:00Z","hash":"h2"}]'::jsonb,
    'Munkanaptár'
  );
  if (select count(*) from public.availability_blocks where user_id = '30000000-0000-4000-8000-000000000003' and source = 'google' and cancelled_at is null) <> 2 then
    raise exception 'TC-INT-004: a Google-foglaltság nem került be';
  end if;
  perform private.sync_google_busy_blocks(
    '30000000-0000-4000-8000-000000000003',
    '[{"starts_at":"2026-09-18T08:00:00Z","ends_at":"2026-09-18T09:00:00Z","hash":"h1"}]'::jsonb,
    null
  );
  if (select count(*) from public.availability_blocks where user_id = '30000000-0000-4000-8000-000000000003' and source = 'google' and cancelled_at is null) <> 1 then
    raise exception 'TC-INT-004: a hiányzó hash foglaltsága nem vonódott vissza';
  end if;
  if (select status from public.calendar_connections where user_id = '30000000-0000-4000-8000-000000000003') <> 'connected' then
    raise exception 'TC-INT-004: a naptárkapcsolat állapota hibás';
  end if;

  perform private.run_notification_jobs(now());
  if (select count(*) from public.job_runs where status = 'succeeded') < 4 then
    raise exception 'TC-INT-007: a háttérfeladat-futás nem naplózott sikeres futást';
  end if;
end;
$$;

set local role anon;
do $$
begin
  begin
    perform 1 from public.projects limit 1;
    raise exception 'TC-RLS-001: az anonim szerep lekérdezést hajthatott végre';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform 1 from public.tasks limit 1;
    raise exception 'TC-RLS-001B: az anonim szerep feladatot kérdezhetett le';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform 1 from public.notifications limit 1;
    raise exception 'TC-RLS-001C: az anonim szerep értesítést kérdezhetett le';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

rollback;
