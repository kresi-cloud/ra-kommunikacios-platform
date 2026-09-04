begin;

do $$
declare
  pilot_user_id uuid;
begin
  select id
    into strict pilot_user_id
    from auth.users
   where lower(email) = 'pilot-user@example.com';

  insert into public.profiles (
    id, display_name, email, is_internal_member, account_status,
    created_by, updated_by
  ) values (
    pilot_user_id, 'Pilot felhasználó', 'pilot-user@example.com', true, 'active',
    null, null
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    email = excluded.email,
    is_internal_member = true,
    account_status = 'active',
    updated_at = now();

  if not exists (
    select 1
      from public.user_role_assignments
     where user_id = pilot_user_id
       and role_id = '10000000-0000-0000-0000-000000000004'::uuid
       and scope_type = 'global'
       and revoked_at is null
  ) then
    insert into public.user_role_assignments (
      user_id, role_id, scope_type, scope_id,
      appointed_by, initiated_by, reason
    ) values (
      pilot_user_id,
      '10000000-0000-0000-0000-000000000004'::uuid,
      'global',
      null,
      pilot_user_id,
      pilot_user_id,
      'Korlátozott pilot hozzáférés létrehozása'
    );
  end if;

  insert into public.audit_log (
    actor_user_id, actor_type, action, entity_type, entity_id, metadata
  ) values (
    pilot_user_id, 'system', 'pilot_profile_activated', 'profile', pilot_user_id,
    jsonb_build_object('role', 'staff_member', 'source', 'controlled migration')
  );
end;
$$;

commit;
