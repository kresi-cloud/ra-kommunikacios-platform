begin;

do $$
declare
  pilot_user_id uuid;
  demo_season_id constant uuid := '20000000-0000-0000-0000-000000000001';
begin
  select u.id
  into pilot_user_id
  from auth.users u
  where lower(u.email) = 'pilot-user@example.com'
  limit 1;

  -- The hosted pilot has this account. Fresh CI databases intentionally skip
  -- the demo seed so schema tests do not depend on an auth fixture.
  if pilot_user_id is null then
    raise notice 'Pilot user is absent; demo data seed skipped.';
    return;
  end if;

  insert into public.seasons (
    id, name, starts_on, ends_on, is_default, is_active,
    created_by, updated_by
  ) values (
    demo_season_id, '2026 őszi demóidőszak', '2026-08-01', '2026-12-20',
    not exists (select 1 from public.seasons where is_default), true,
    pilot_user_id, pilot_user_id
  )
  on conflict (id) do update set
    name = excluded.name,
    starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    is_active = true,
    updated_by = pilot_user_id;

  insert into public.tags (id, name, is_active, created_by, updated_by)
  values
    ('21000000-0000-0000-0000-000000000001', 'DEMO – kampány', true, pilot_user_id, pilot_user_id),
    ('21000000-0000-0000-0000-000000000002', 'DEMO – sajtó', true, pilot_user_id, pilot_user_id),
    ('21000000-0000-0000-0000-000000000003', 'DEMO – rendezvény', true, pilot_user_id, pilot_user_id),
    ('21000000-0000-0000-0000-000000000004', 'DEMO – digitális', true, pilot_user_id, pilot_user_id),
    ('21000000-0000-0000-0000-000000000005', 'DEMO – utánpótlás', true, pilot_user_id, pilot_user_id)
  on conflict (id) do update set
    name = excluded.name,
    is_active = true,
    updated_by = pilot_user_id;

  insert into public.projects (
    id, project_code, title, summary, objective, owner_user_id,
    starts_on, ends_on, status, season_id,
    closed_at, closed_by, created_by, updated_by
  ) values
    (
      '30000000-0000-0000-0000-000000000001', 'DEMO-PROJ-001',
      'Őszi közösségi kampány',
      'Fiktív, többcsatornás kampány a helyi közösségek megszólítására.',
      'A programismertség növelése és egységes szeptemberi kommunikáció.',
      pilot_user_id, '2026-08-24', '2026-11-15', 'active', demo_season_id,
      null, null, pilot_user_id, pilot_user_id
    ),
    (
      '30000000-0000-0000-0000-000000000002', 'DEMO-PROJ-002',
      'Szakmai konferencia kommunikáció',
      'Fiktív kommunikációs projekt egy budapesti szakmai konferenciához.',
      'A sajtómegjelenések, meghívók és helyszíni tartalmak összehangolása.',
      pilot_user_id, '2026-09-01', '2026-10-05', 'active', demo_season_id,
      null, null, pilot_user_id, pilot_user_id
    ),
    (
      '30000000-0000-0000-0000-000000000003', 'DEMO-PROJ-003',
      'Ifjúsági sportnap',
      'Fiktív, előkészítés alatt álló országos közösségi sportesemény.',
      'Fiatal célcsoportot elérő program- és médiaterv kialakítása.',
      pilot_user_id, '2026-10-01', '2026-10-31', 'draft', demo_season_id,
      null, null, pilot_user_id, pilot_user_id
    ),
    (
      '30000000-0000-0000-0000-000000000004', 'DEMO-PROJ-004',
      'Nyári eredménykommunikáció',
      'Lezárt fiktív projekt a nyári programok eredményeinek bemutatására.',
      'A legfontosabb eredmények összefoglalása és publikálása.',
      pilot_user_id, '2026-06-15', '2026-08-20', 'closed', demo_season_id,
      '2026-08-21 14:00:00+02', pilot_user_id, pilot_user_id, pilot_user_id
    )
  on conflict (id) do update set
    project_code = excluded.project_code,
    title = excluded.title,
    summary = excluded.summary,
    objective = excluded.objective,
    owner_user_id = pilot_user_id,
    starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    status = excluded.status,
    season_id = demo_season_id,
    closed_at = excluded.closed_at,
    closed_by = excluded.closed_by,
    updated_by = pilot_user_id;

  insert into public.project_members (
    id, project_id, user_id, membership_role, added_by
  )
  select
    ('31000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
    ('30000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
    pilot_user_id,
    'owner',
    pilot_user_id
  from generate_series(1, 4) as n
  where not exists (
    select 1
    from public.project_members pm
    where pm.project_id = ('30000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid
      and pm.user_id = pilot_user_id
      and pm.left_at is null
  );

  insert into public.project_tags (project_id, tag_id, added_by)
  values
    ('30000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', pilot_user_id),
    ('30000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000004', pilot_user_id),
    ('30000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000002', pilot_user_id),
    ('30000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000003', pilot_user_id),
    ('30000000-0000-0000-0000-000000000003', '21000000-0000-0000-0000-000000000003', pilot_user_id),
    ('30000000-0000-0000-0000-000000000003', '21000000-0000-0000-0000-000000000005', pilot_user_id),
    ('30000000-0000-0000-0000-000000000004', '21000000-0000-0000-0000-000000000004', pilot_user_id)
  on conflict (project_id, tag_id) do nothing;

  insert into public.events (
    id, event_code, title, description, event_type, responsible_user_id,
    project_id, starts_at, ends_at, location_name, location_address,
    online_url, is_mandatory, response_due_at, status,
    importance_for_namesake, outcome_code, cancel_reason,
    created_by, updated_by
  ) values
    (
      '50000000-0000-0000-0000-000000000001', 'DEMO-EVENT-001',
      'Kampánynyitó szerkesztőségi egyeztetés',
      'Fiktív heti indító megbeszélés a csatornák és felelősök véglegesítésére.',
      'meeting', pilot_user_id, '30000000-0000-0000-0000-000000000001',
      '2026-09-07 09:00:00+02', '2026-09-07 10:00:00+02',
      'Online tárgyaló', null, 'https://meet.example.com/demo-kampany', true,
      '2026-09-06 12:00:00+02', 'scheduled', false, null, null,
      pilot_user_id, pilot_user_id
    ),
    (
      '50000000-0000-0000-0000-000000000002', 'DEMO-EVENT-002',
      'Fiktív sajtóreggeli',
      'Háttérbeszélgetés a konferencia fő témáiról.',
      'press_event', pilot_user_id, '30000000-0000-0000-0000-000000000002',
      '2026-09-10 08:30:00+02', '2026-09-10 10:30:00+02',
      'Duna Konferenciaközpont', '1051 Budapest, Példa tér 2.', null, true,
      '2026-09-08 16:00:00+02', 'scheduled', true, null, null,
      pilot_user_id, pilot_user_id
    ),
    (
      '50000000-0000-0000-0000-000000000003', 'DEMO-EVENT-003',
      'Kampányfotózás',
      'Fiktív fotó- és rövidvideó-forgatás a közösségi felületekre.',
      'production', pilot_user_id, '30000000-0000-0000-0000-000000000001',
      '2026-09-15 13:00:00+02', '2026-09-15 17:00:00+02',
      'Városi Sportpark', '1117 Budapest, Minta sétány 8.', null, false,
      null, 'scheduled', false, null, null,
      pilot_user_id, pilot_user_id
    ),
    (
      '50000000-0000-0000-0000-000000000004', 'DEMO-EVENT-004',
      'Konferencia főnap',
      'Fiktív szakmai konferencia előadásokkal és sajtóponttal.',
      'conference', pilot_user_id, '30000000-0000-0000-0000-000000000002',
      '2026-09-24 09:00:00+02', '2026-09-24 17:30:00+02',
      'Duna Konferenciaközpont', '1051 Budapest, Példa tér 2.', null, true,
      '2026-09-18 12:00:00+02', 'scheduled', true, null, null,
      pilot_user_id, pilot_user_id
    ),
    (
      '50000000-0000-0000-0000-000000000005', 'DEMO-EVENT-005',
      'Nyári kampányzáró értékelés',
      'A lezárt fiktív projekt eredményeinek értékelése.',
      'meeting', pilot_user_id, '30000000-0000-0000-0000-000000000004',
      '2026-08-20 14:00:00+02', '2026-08-20 15:30:00+02',
      'Online tárgyaló', null, 'https://meet.example.com/demo-zaras', false,
      null, 'occurred', false, null, null,
      pilot_user_id, pilot_user_id
    ),
    (
      '50000000-0000-0000-0000-000000000006', 'DEMO-EVENT-006',
      'Sportnapi helyszínbejárás',
      'Fiktív helyszíni bejárás, amelyet időjárás miatt lemondtak.',
      'event', pilot_user_id, '30000000-0000-0000-0000-000000000003',
      '2026-09-03 15:00:00+02', '2026-09-03 16:00:00+02',
      'Ifjúsági Sportcentrum', '1146 Budapest, Próba út 12.', null, false,
      null, 'cancelled', false, 'did_not_occur', 'Fiktív lemondás: kedvezőtlen időjárás.',
      pilot_user_id, pilot_user_id
    )
  on conflict (id) do update set
    event_code = excluded.event_code,
    title = excluded.title,
    description = excluded.description,
    event_type = excluded.event_type,
    responsible_user_id = pilot_user_id,
    project_id = excluded.project_id,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    location_name = excluded.location_name,
    location_address = excluded.location_address,
    online_url = excluded.online_url,
    is_mandatory = excluded.is_mandatory,
    response_due_at = excluded.response_due_at,
    status = excluded.status,
    importance_for_namesake = excluded.importance_for_namesake,
    outcome_code = excluded.outcome_code,
    cancel_reason = excluded.cancel_reason,
    updated_by = pilot_user_id;

  insert into public.event_participants (
    id, event_id, participant_type, user_id, status, response_required,
    responded_at, responded_by_user_id, invited_by
  )
  select
    ('51000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
    ('50000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
    'user', pilot_user_id, 'accepted', true,
    '2026-09-04 09:00:00+02'::timestamptz, pilot_user_id, pilot_user_id
  from generate_series(1, 6) as n
  on conflict (id) do update set
    status = 'accepted',
    responded_at = excluded.responded_at,
    responded_by_user_id = pilot_user_id;

  insert into public.event_participants (
    id, event_id, participant_type, external_name, external_email,
    status, response_required, invited_by
  ) values
    (
      '51000000-0000-0000-0001-000000000001',
      '50000000-0000-0000-0000-000000000002',
      'external', 'Kovács Anna (fiktív)', 'anna.kovacs@example.com',
      'invited', true, pilot_user_id
    ),
    (
      '51000000-0000-0000-0001-000000000002',
      '50000000-0000-0000-0000-000000000004',
      'external', 'Nagy Bálint (fiktív)', 'balint.nagy@example.com',
      'no_response_required', false, pilot_user_id
    )
  on conflict (id) do nothing;

  insert into public.tasks (
    id, task_code, title, description, responsible_user_id, project_id,
    event_id, status, acceptance_status, priority, due_at, unscheduled,
    is_publication_required, requires_review, reviewer_user_id,
    started_at, completed_at, completed_by, created_by, updated_by
  ) values
    (
      '40000000-0000-0000-0000-000000000001', 'DEMO-TASK-001',
      'Kampányüzenetek véglegesítése',
      'A fiktív kampány három fő üzenetének és célcsoportjának véglegesítése.',
      pilot_user_id, '30000000-0000-0000-0000-000000000001', null,
      'completed', 'accepted', 'normal', '2026-09-02 16:00:00+02', false,
      false, false, null, '2026-08-31 09:00:00+02',
      '2026-09-02 14:30:00+02', pilot_user_id, pilot_user_id, pilot_user_id
    ),
    (
      '40000000-0000-0000-0000-000000000002', 'DEMO-TASK-002',
      'Szeptemberi tartalomnaptár összeállítása',
      'Posztok, rövid videók és hírlevél-időpontok rögzítése.',
      pilot_user_id, '30000000-0000-0000-0000-000000000001', null,
      'in_progress', 'accepted', 'critical', '2026-09-05 12:00:00+02', false,
      true, false, null, '2026-09-03 10:00:00+02',
      null, null, pilot_user_id, pilot_user_id
    ),
    (
      '40000000-0000-0000-0000-000000000003', 'DEMO-TASK-003',
      'Fotózási helyszínengedély beszerzése',
      'Fiktív engedélykérés a városi sportpark kezelőjétől.',
      pilot_user_id, '30000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000003',
      'blocked', 'obstacle_reported', 'normal', '2026-09-08 16:00:00+02', false,
      false, false, null, '2026-09-02 11:00:00+02',
      null, null, pilot_user_id, pilot_user_id
    ),
    (
      '40000000-0000-0000-0000-000000000004', 'DEMO-TASK-004',
      'Sajtólista ellenőrzése',
      'A fiktív meghívotti lista duplikációinak és elérhetőségeinek ellenőrzése.',
      pilot_user_id, '30000000-0000-0000-0000-000000000002',
      '50000000-0000-0000-0000-000000000002',
      'assigned', 'pending', 'normal', '2026-09-07 15:00:00+02', false,
      false, false, null, null, null, null, pilot_user_id, pilot_user_id
    ),
    (
      '40000000-0000-0000-0000-000000000005', 'DEMO-TASK-005',
      'Konferenciameghívó szövegezése',
      'Rövid és hosszú fiktív meghívóverzió elkészítése.',
      pilot_user_id, '30000000-0000-0000-0000-000000000002',
      '50000000-0000-0000-0000-000000000004',
      'accepted', 'accepted', 'normal', '2026-09-10 12:00:00+02', false,
      false, false, null, null, null, null, pilot_user_id, pilot_user_id
    ),
    (
      '40000000-0000-0000-0000-000000000006', 'DEMO-TASK-006',
      'Sajtóközlemény szakmai ellenőrzése',
      'A fiktív konferencia sajtóanyagának belső felülvizsgálata.',
      pilot_user_id, '30000000-0000-0000-0000-000000000002', null,
      'in_review', 'accepted', 'critical', '2026-09-12 10:00:00+02', false,
      true, true, pilot_user_id, '2026-09-04 08:00:00+02',
      null, null, pilot_user_id, pilot_user_id
    ),
    (
      '40000000-0000-0000-0000-000000000007', 'DEMO-TASK-007',
      'Sportnapi kommunikációs koncepció',
      'Első fiktív koncepcióvázlat; még nincs ütemezve.',
      pilot_user_id, '30000000-0000-0000-0000-000000000003', null,
      'draft', 'not_requested', 'normal', null, true,
      false, false, null, null, null, null, pilot_user_id, pilot_user_id
    ),
    (
      '40000000-0000-0000-0000-000000000008', 'DEMO-TASK-008',
      'Helyszíni arculati igények pontosítása',
      'Tisztázandó a színpad, fotófal és irányítótáblák végleges mérete.',
      pilot_user_id, '30000000-0000-0000-0000-000000000003', null,
      'clarification_needed', 'clarification_requested', 'normal',
      '2026-09-14 12:00:00+02', false,
      false, false, null, null, null, null, pilot_user_id, pilot_user_id
    ),
    (
      '40000000-0000-0000-0000-000000000009', 'DEMO-TASK-009',
      'Nyári eredményösszefoglaló publikálása',
      'A lezárt fiktív projekt összefoglalójának közzététele.',
      pilot_user_id, '30000000-0000-0000-0000-000000000004', null,
      'completed', 'accepted', 'normal', '2026-08-19 11:00:00+02', false,
      true, false, null, '2026-08-17 09:00:00+02',
      '2026-08-19 10:15:00+02', pilot_user_id, pilot_user_id, pilot_user_id
    ),
    (
      '40000000-0000-0000-0000-000000000010', 'DEMO-TASK-010',
      'Konferencia napi közösségi posztjai',
      'A fiktív konferencia élő közösségimédia-posztjainak előkészítése.',
      pilot_user_id, '30000000-0000-0000-0000-000000000002',
      '50000000-0000-0000-0000-000000000004',
      'in_progress', 'accepted', 'normal', '2026-09-23 16:00:00+02', false,
      true, false, null, '2026-09-04 10:00:00+02',
      null, null, pilot_user_id, pilot_user_id
    )
  on conflict (id) do update set
    task_code = excluded.task_code,
    title = excluded.title,
    description = excluded.description,
    responsible_user_id = pilot_user_id,
    project_id = excluded.project_id,
    event_id = excluded.event_id,
    status = excluded.status,
    acceptance_status = excluded.acceptance_status,
    priority = excluded.priority,
    due_at = excluded.due_at,
    unscheduled = excluded.unscheduled,
    is_publication_required = excluded.is_publication_required,
    requires_review = excluded.requires_review,
    reviewer_user_id = excluded.reviewer_user_id,
    started_at = excluded.started_at,
    completed_at = excluded.completed_at,
    completed_by = excluded.completed_by,
    updated_by = pilot_user_id;

  insert into public.task_block_details (
    id, task_id, block_reason_code, details,
    waiting_for_external_party, started_at
  ) values (
    '41000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000003',
    'external_approval',
    'Fiktív akadály: a helyszín kezelőjének írásos jóváhagyása még nem érkezett meg.',
    true,
    '2026-09-04 08:30:00+02'
  )
  on conflict (id) do update set
    details = excluded.details,
    waiting_for_external_party = true,
    resolved_at = null,
    resolved_by = null,
    resolution_note = null;

  insert into public.task_assignments_history (
    id, task_id, from_user_id, to_user_id, reason, changed_by, changed_at
  ) values (
    '42000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    null, pilot_user_id,
    'Demófeladat kiosztása a pilot felhasználónak.',
    pilot_user_id, '2026-09-03 09:30:00+02'
  )
  on conflict (id) do nothing;

  insert into public.task_deadline_history (
    id, task_id, old_due_at, new_due_at, reason, changed_by, changed_at
  ) values (
    '43000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000006',
    '2026-09-11 10:00:00+02', '2026-09-12 10:00:00+02',
    'Fiktív módosítás: a szakmai ellenőrzés egy nappal későbbre került.',
    pilot_user_id, '2026-09-04 08:15:00+02'
  )
  on conflict (id) do nothing;

  insert into public.availability_blocks (
    id, user_id, starts_at, ends_at, visibility, source
  ) values
    (
      '60000000-0000-0000-0000-000000000001', pilot_user_id,
      '2026-09-08 13:00:00+02', '2026-09-08 15:00:00+02',
      'busy_only', 'manual'
    ),
    (
      '60000000-0000-0000-0000-000000000002', pilot_user_id,
      '2026-09-11 10:00:00+02', '2026-09-11 11:30:00+02',
      'busy_only', 'manual'
    )
  on conflict (id) do update set
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at;
end
$$;

commit;
