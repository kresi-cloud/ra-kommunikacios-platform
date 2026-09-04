begin;

-- PostgreSQL accepts UUID-shaped values without RFC version/variant bits,
-- while the client validator intentionally requires RFC 4122 UUIDs. Repair
-- the initial deterministic demo identifiers without losing demo edits.
create temporary table demo_uuid_repair_marker (id integer) on commit drop;

create function pg_temp.as_v4_uuid(input_id uuid)
returns uuid
language sql
immutable
strict
as $$
  select overlay(
    overlay(input_id::text placing '4' from 15 for 1)
    placing '8' from 20 for 1
  )::uuid
$$;

create temporary table demo_season_map on commit drop as
select id as old_id, pg_temp.as_v4_uuid(id) as new_id
from public.seasons
where name = '2026 őszi demóidőszak'
  and id <> pg_temp.as_v4_uuid(id);

create temporary table demo_tag_map on commit drop as
select id as old_id, pg_temp.as_v4_uuid(id) as new_id
from public.tags
where name like 'DEMO – %'
  and id <> pg_temp.as_v4_uuid(id);

create temporary table demo_project_map on commit drop as
select id as old_id, pg_temp.as_v4_uuid(id) as new_id
from public.projects
where project_code like 'DEMO-PROJ-%'
  and id <> pg_temp.as_v4_uuid(id);

create temporary table demo_event_map on commit drop as
select id as old_id, pg_temp.as_v4_uuid(id) as new_id
from public.events
where event_code like 'DEMO-EVENT-%'
  and id <> pg_temp.as_v4_uuid(id);

create temporary table demo_task_map on commit drop as
select id as old_id, pg_temp.as_v4_uuid(id) as new_id
from public.tasks
where task_code like 'DEMO-TASK-%'
  and id <> pg_temp.as_v4_uuid(id);

alter table public.projects
  alter constraint projects_season_id_fkey deferrable initially deferred;
alter table public.project_members
  alter constraint project_members_project_id_fkey deferrable initially deferred;
alter table public.project_tags
  alter constraint project_tags_project_id_fkey deferrable initially deferred,
  alter constraint project_tags_tag_id_fkey deferrable initially deferred;
alter table public.project_critical_blocks
  alter constraint project_critical_blocks_project_id_fkey deferrable initially deferred;
alter table public.events
  alter constraint events_project_id_fkey deferrable initially deferred;
alter table public.event_participants
  alter constraint event_participants_event_id_fkey deferrable initially deferred;
alter table public.event_change_log
  alter constraint event_change_log_event_id_fkey deferrable initially deferred;
alter table public.tasks
  alter constraint tasks_project_id_fkey deferrable initially deferred,
  alter constraint tasks_event_id_fkey deferrable initially deferred,
  alter constraint tasks_parent_task_id_fkey deferrable initially deferred;
alter table public.task_assignments_history
  alter constraint task_assignments_history_task_id_fkey deferrable initially deferred;
alter table public.task_deadline_history
  alter constraint task_deadline_history_task_id_fkey deferrable initially deferred;
alter table public.task_block_details
  alter constraint task_block_details_task_id_fkey deferrable initially deferred;

set constraints all deferred;

update public.seasons target
set id = mapping.new_id
from demo_season_map mapping
where target.id = mapping.old_id;

update public.tags target
set id = mapping.new_id
from demo_tag_map mapping
where target.id = mapping.old_id;

update public.projects target
set id = mapping.new_id
from demo_project_map mapping
where target.id = mapping.old_id;

update public.events target
set id = mapping.new_id
from demo_event_map mapping
where target.id = mapping.old_id;

update public.tasks target
set id = mapping.new_id
from demo_task_map mapping
where target.id = mapping.old_id;

update public.projects target
set season_id = mapping.new_id
from demo_season_map mapping
where target.season_id = mapping.old_id;

update public.project_members target
set project_id = mapping.new_id
from demo_project_map mapping
where target.project_id = mapping.old_id;

update public.project_tags target
set project_id = mapping.new_id
from demo_project_map mapping
where target.project_id = mapping.old_id;

update public.project_tags target
set tag_id = mapping.new_id
from demo_tag_map mapping
where target.tag_id = mapping.old_id;

update public.project_critical_blocks target
set project_id = mapping.new_id
from demo_project_map mapping
where target.project_id = mapping.old_id;

update public.events target
set project_id = mapping.new_id
from demo_project_map mapping
where target.project_id = mapping.old_id;

update public.tasks target
set project_id = mapping.new_id
from demo_project_map mapping
where target.project_id = mapping.old_id;

update public.event_participants target
set event_id = mapping.new_id
from demo_event_map mapping
where target.event_id = mapping.old_id;

update public.event_change_log target
set event_id = mapping.new_id
from demo_event_map mapping
where target.event_id = mapping.old_id;

update public.tasks target
set event_id = mapping.new_id
from demo_event_map mapping
where target.event_id = mapping.old_id;

update public.tasks target
set parent_task_id = mapping.new_id
from demo_task_map mapping
where target.parent_task_id = mapping.old_id;

update public.task_assignments_history target
set task_id = mapping.new_id
from demo_task_map mapping
where target.task_id = mapping.old_id;

update public.task_deadline_history target
set task_id = mapping.new_id
from demo_task_map mapping
where target.task_id = mapping.old_id;

update public.task_block_details target
set task_id = mapping.new_id
from demo_task_map mapping
where target.task_id = mapping.old_id;

-- These scope/audit columns are polymorphic and therefore have no FK.
update public.user_role_assignments target
set scope_id = mapping.new_id
from demo_project_map mapping
where target.scope_type = 'project' and target.scope_id = mapping.old_id;

update public.user_permission_grants target
set scope_id = mapping.new_id
from demo_project_map mapping
where target.scope_type = 'project' and target.scope_id = mapping.old_id;

update public.delegations target
set scope_id = mapping.new_id
from demo_project_map mapping
where target.scope_type = 'project' and target.scope_id = mapping.old_id;

update public.audit_log target
set project_id = mapping.new_id
from demo_project_map mapping
where target.project_id = mapping.old_id;

update public.audit_log target
set entity_id = mapping.new_id
from demo_project_map mapping
where target.entity_type = 'project' and target.entity_id = mapping.old_id;

update public.audit_log target
set entity_id = mapping.new_id
from demo_event_map mapping
where target.entity_type = 'event' and target.entity_id = mapping.old_id;

update public.audit_log target
set entity_id = mapping.new_id
from demo_task_map mapping
where target.entity_type = 'task' and target.entity_id = mapping.old_id;

update public.project_members
set id = pg_temp.as_v4_uuid(id)
where id::text like '31000000-%' and id <> pg_temp.as_v4_uuid(id);

update public.event_participants
set id = pg_temp.as_v4_uuid(id)
where id::text like '51000000-%' and id <> pg_temp.as_v4_uuid(id);

update public.event_change_log
set id = pg_temp.as_v4_uuid(id)
where id::text like '52000000-%' and id <> pg_temp.as_v4_uuid(id);

update public.task_block_details
set id = pg_temp.as_v4_uuid(id)
where id::text like '41000000-%' and id <> pg_temp.as_v4_uuid(id);

update public.task_assignments_history
set id = pg_temp.as_v4_uuid(id)
where id::text like '42000000-%' and id <> pg_temp.as_v4_uuid(id);

update public.task_deadline_history
set id = pg_temp.as_v4_uuid(id)
where id::text like '43000000-%' and id <> pg_temp.as_v4_uuid(id);

update public.availability_blocks
set id = pg_temp.as_v4_uuid(id)
where id::text like '60000000-%' and id <> pg_temp.as_v4_uuid(id);

set constraints all immediate;

commit;
