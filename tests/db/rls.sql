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
end;
$$;

select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000004', true);
do $$
begin
  if exists (select 1 from public.projects) then
    raise exception 'TC-RLS-009: a technikai admin közvetlen projektadatot lát';
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
end;
$$;

rollback;
