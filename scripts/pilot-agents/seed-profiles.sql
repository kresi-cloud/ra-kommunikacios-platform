-- Pilot-ágens fiókok bekötése: a Supabase Auth felületén már létrehozott
-- (e-mail/jelszó, megerősített) fiókokhoz készít profilt és szerepkiosztást.
-- Nyilvános regisztráció nincs, ezért az auth.users sort előbb a Supabase
-- Dashboard → Authentication → Users → Add user felületén kell létrehozni.
--
-- Futtatás a Supabase SQL Editorban vagy psql-lel, a négy e-mail cím
-- megadásával (idézőjel nélkül, a -v mindig nyers szöveget vár). A negyedik
-- (technikai admin) fiók opcionális; ha nem kell, hagyd üresen:
--
--   psql "$SUPABASE_TEST_DB_URL" \
--     -v lead_email=pilot-lead@example.test \
--     -v owner_email=pilot-owner@example.test \
--     -v staff_email=pilot-staff@example.test \
--     -v admin_email="" \
--     -f scripts/pilot-agents/seed-profiles.sql
--
-- Csak fiktív, teszt célú e-mail cím használható. A szkript idempotens:
-- többször futtatva sem hoz létre duplikált profilt vagy szerepkiosztást.

begin;

do $$
declare
  lead_email text := :'lead_email';
  owner_email text := :'owner_email';
  staff_email text := :'staff_email';
  admin_email text := nullif(:'admin_email', '');
  lead_id uuid;
  owner_id uuid;
  staff_id uuid;
  admin_id uuid;
  role_lead uuid := '10000000-0000-0000-0000-000000000001';
  role_admin uuid := '10000000-0000-0000-0000-000000000002';
  role_owner uuid := '10000000-0000-0000-0000-000000000003';
  role_staff uuid := '10000000-0000-0000-0000-000000000004';
begin
  select id into lead_id from auth.users where lower(email) = lower(lead_email);
  select id into owner_id from auth.users where lower(email) = lower(owner_email);
  select id into staff_id from auth.users where lower(email) = lower(staff_email);

  if lead_id is null or owner_id is null or staff_id is null then
    raise exception 'Legalább egy pilot-fiók hiányzik a Supabase Auth-ból. Hozd létre a Dashboardon, majd futtasd újra.';
  end if;

  insert into public.profiles (id, display_name, email, is_internal_member, account_status)
  values
    (lead_id, 'Pilot – Kommunikációs vezető', lead_email, true, 'active'),
    (owner_id, 'Pilot – Projektgazda', owner_email, true, 'active'),
    (staff_id, 'Pilot – Munkatárs', staff_email, true, 'active')
  on conflict (id) do update set
    display_name = excluded.display_name, email = excluded.email,
    is_internal_member = true, account_status = 'active', updated_at = now();

  insert into public.user_role_assignments (user_id, role_id, appointed_by, initiated_by, reason)
  values
    (lead_id, role_lead, lead_id, lead_id, 'Pilot-ágens seed'),
    (owner_id, role_owner, lead_id, lead_id, 'Pilot-ágens seed'),
    (staff_id, role_staff, lead_id, lead_id, 'Pilot-ágens seed')
  on conflict (user_id, role_id, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
    where revoked_at is null
    do nothing;

  raise notice 'Pilot-fiókok kész: vezető=%, projektgazda=%, munkatárs=%', lead_id, owner_id, staff_id;

  if admin_email is not null then
    select id into admin_id from auth.users where lower(email) = lower(admin_email);
    if admin_id is not null then
      insert into public.profiles (id, display_name, email, is_internal_member, account_status)
      values (admin_id, 'Pilot – Technikai admin', admin_email, true, 'active')
      on conflict (id) do update set
        display_name = excluded.display_name, email = excluded.email,
        is_internal_member = true, account_status = 'active', updated_at = now();

      insert into public.user_role_assignments (user_id, role_id, appointed_by, initiated_by, reason)
      values (admin_id, role_admin, lead_id, lead_id, 'Pilot-ágens seed')
      on conflict (user_id, role_id, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
        where revoked_at is null
        do nothing;

      raise notice 'Pilot technikai admin fiók kész: %', admin_id;
    else
      raise notice 'A megadott admin e-mail nem található az auth.users táblában, ez a lépés kimaradt.';
    end if;
  end if;
end;
$$;

commit;
