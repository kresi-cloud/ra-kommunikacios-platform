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
  if (select count(*) from public.events) <> 1 then
    raise exception 'TC-RLS-EVENT: a projektgazda nem pontosan a saját projekteseményét látja';
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

select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);
select public.create_project('Létrehozási tesztprojekt', '30000000-0000-4000-8000-000000000003');
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
end;
$$;

reset role;
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
end;
$$;

rollback;
