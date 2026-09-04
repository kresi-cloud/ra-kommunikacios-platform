begin;

alter table public.availability_blocks
  add column cancelled_at timestamptz,
  add column cancelled_by uuid references public.profiles(id) on delete restrict;

create index availability_active_time_idx
  on public.availability_blocks(starts_at, ends_at) where cancelled_at is null;

drop policy availability_read_own on public.availability_blocks;
create policy availability_read_own on public.availability_blocks for select to authenticated
using (
  private.is_active_user() and not private.is_technical_admin()
  and user_id = auth.uid() and cancelled_at is null
);

create or replace function public.list_assignable_users(target_project_id uuid default null)
returns table(user_id uuid, display_name text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.display_name
  from public.profiles p
  where private.is_active_user()
    and not private.is_technical_admin()
    and p.account_status = 'active'
    and (
      private.is_communication_lead()
      or (target_project_id is null and p.id = auth.uid())
      or (
        target_project_id is not null
        and private.can_access_project(target_project_id)
        and (
          p.id = (select pr.owner_user_id from public.projects pr where pr.id = target_project_id)
          or exists (
            select 1 from public.project_members pm
            where pm.project_id = target_project_id and pm.user_id = p.id and pm.left_at is null
          )
        )
      )
    )
  order by p.display_name
$$;

create or replace function public.list_active_users()
returns table(user_id uuid, display_name text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.display_name
  from public.profiles p
  where private.is_active_user() and not private.is_technical_admin()
    and p.account_status = 'active'
    and not exists (
      select 1 from public.user_role_assignments ura
      join public.roles r on r.id = ura.role_id
      where ura.user_id = p.id and r.code = 'technical_admin' and r.is_active
        and ura.revoked_at is null and ura.valid_from <= now()
        and (ura.valid_until is null or ura.valid_until > now())
    )
  order by p.display_name
$$;

create or replace function public.create_scheduled_event(
  event_title text,
  event_kind public.event_type,
  event_responsible_user_id uuid,
  event_project_id uuid,
  event_description text,
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
declare created_event public.events;
begin
  created_event := public.create_event(
    event_title, event_kind, event_responsible_user_id, event_project_id, event_description
  );
  return public.schedule_event(
    created_event.id, event_starts_at, event_ends_at, event_location_name,
    event_location_address, event_online_url, event_is_mandatory, event_response_due_at
  );
end;
$$;

create or replace function public.list_event_participants(target_event_id uuid)
returns table(
  participant_id uuid, user_id uuid, display_name text,
  status public.event_participant_status, response_required boolean
)
language sql stable security definer set search_path = ''
as $$
  select ep.id, ep.user_id, coalesce(p.display_name, ep.external_name, 'Külső résztvevő'),
    ep.status, ep.response_required
  from public.event_participants ep
  left join public.profiles p on p.id = ep.user_id
  where ep.event_id = target_event_id and private.can_access_event(target_event_id)
  order by ep.invited_at
$$;

create or replace function public.create_availability_block(
  block_starts_at timestamptz,
  block_ends_at timestamptz
)
returns public.availability_blocks
language plpgsql security definer set search_path = ''
as $$
declare created_block public.availability_blocks;
begin
  if not private.is_active_user() or private.is_technical_admin() then
    raise exception 'Nincs jogosultság foglaltság rögzítésére.' using errcode = '42501';
  end if;
  if block_ends_at <= block_starts_at then
    raise exception 'A foglaltság vége nem lehet korábbi a kezdeténél.' using errcode = '22023';
  end if;
  insert into public.availability_blocks(user_id, starts_at, ends_at)
  values (auth.uid(), block_starts_at, block_ends_at)
  returning * into created_block;
  perform private.write_audit(
    'availability.created', 'availability_block', created_block.id, null,
    null, jsonb_build_object('starts_at', block_starts_at, 'ends_at', block_ends_at), null
  );
  return created_block;
end;
$$;

create or replace function public.cancel_availability_block(target_block_id uuid)
returns public.availability_blocks
language plpgsql security definer set search_path = ''
as $$
declare cancelled_block public.availability_blocks;
begin
  update public.availability_blocks
  set cancelled_at = now(), cancelled_by = auth.uid()
  where id = target_block_id and user_id = auth.uid() and cancelled_at is null
  returning * into cancelled_block;
  if not found then
    raise exception 'A foglaltság nem található vagy nem módosítható.' using errcode = '42501';
  end if;
  perform private.write_audit(
    'availability.cancelled', 'availability_block', cancelled_block.id, null,
    null, jsonb_build_object('cancelled_at', cancelled_block.cancelled_at), null
  );
  return cancelled_block;
end;
$$;

create or replace function public.list_busy_slots(
  range_starts_at timestamptz,
  range_ends_at timestamptz
)
returns table(user_id uuid, display_name text, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select ab.user_id, p.display_name, ab.starts_at, ab.ends_at
  from public.availability_blocks ab
  join public.profiles p on p.id = ab.user_id
  where private.is_active_user()
    and not private.is_technical_admin()
    and ab.cancelled_at is null
    and ab.ends_at >= range_starts_at
    and ab.starts_at <= range_ends_at
    and p.account_status = 'active'
  order by ab.starts_at
$$;

revoke all on function public.list_assignable_users(uuid) from public, anon;
grant execute on function public.list_assignable_users(uuid) to authenticated;
revoke all on function public.list_active_users() from public, anon;
grant execute on function public.list_active_users() to authenticated;
revoke all on function public.create_scheduled_event(text, public.event_type, uuid, uuid, text, timestamptz, timestamptz, text, text, text, boolean, timestamptz) from public, anon;
grant execute on function public.create_scheduled_event(text, public.event_type, uuid, uuid, text, timestamptz, timestamptz, text, text, text, boolean, timestamptz) to authenticated;
revoke all on function public.list_event_participants(uuid) from public, anon;
grant execute on function public.list_event_participants(uuid) to authenticated;
revoke all on function public.create_availability_block(timestamptz, timestamptz) from public, anon;
grant execute on function public.create_availability_block(timestamptz, timestamptz) to authenticated;
revoke all on function public.cancel_availability_block(uuid) from public, anon;
grant execute on function public.cancel_availability_block(uuid) to authenticated;
revoke all on function public.list_busy_slots(timestamptz, timestamptz) from public, anon;
grant execute on function public.list_busy_slots(timestamptz, timestamptz) to authenticated;

commit;
