import type { SupabaseClient } from '@supabase/supabase-js'
import {
  parseCalendarEventRow, type AssignableUser, type AvailabilityBlock, type BusySlot,
  type CalendarEvent, type EventParticipant, type ParticipantStatus
} from '../domain/events'

const eventColumns = 'id,event_code,title,description,event_type,responsible_user_id,project_id,starts_at,ends_at,location_name,online_url,is_mandatory,status,importance_for_namesake'
type RpcResult = { data: unknown; error: { message?: string } | null }

function rpcRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object' && !Array.isArray(row)) : []
}

function rpcRow(value: unknown): Record<string, unknown> {
  const [row] = rpcRows(Array.isArray(value) ? value : [value])
  if (!row) throw new Error('Érvénytelen szerverválasz.')
  return row
}

export async function listCalendarEvents(
  client: SupabaseClient,
  rangeStart: Date,
  rangeEnd: Date
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from('events')
    .select(eventColumns)
    .not('starts_at', 'is', null)
    .not('ends_at', 'is', null)
    .gte('ends_at', rangeStart.toISOString())
    .lte('starts_at', rangeEnd.toISOString())
    .neq('status', 'archived')
    .order('starts_at', { ascending: true })
    .limit(250)

  if (error) throw new Error('A naptár betöltése nem sikerült.')
  return (data ?? []).map((row) => parseCalendarEventRow(row))
}

export async function getCalendarEvent(client: SupabaseClient, id: string): Promise<CalendarEvent> {
  const { data, error } = await client.from('events').select(eventColumns).eq('id', id).single()
  if (error) throw new Error('Az esemény betöltése nem sikerült.')
  return parseCalendarEventRow(data)
}

export type CreateEventInput = {
  title: string
  description?: string | undefined
  eventType: CalendarEvent['eventType']
  responsibleUserId: string
  projectId?: string | undefined
  startsAt: string
  endsAt: string
  locationName?: string | undefined
  onlineUrl?: string | undefined
  isMandatory: boolean
}

export async function createScheduledEvent(client: SupabaseClient, input: CreateEventInput): Promise<CalendarEvent> {
  const { data, error } = await client.rpc('create_scheduled_event', {
    event_title: input.title, event_kind: input.eventType,
    event_responsible_user_id: input.responsibleUserId, event_project_id: input.projectId || null,
    event_description: input.description || null, event_starts_at: input.startsAt,
    event_ends_at: input.endsAt, event_location_name: input.locationName || null,
    event_location_address: null, event_online_url: input.onlineUrl || null,
    event_is_mandatory: input.isMandatory, event_response_due_at: null
  }) as unknown as RpcResult
  if (error) throw new Error(error.message || 'Az esemény létrehozása nem sikerült.')
  return parseCalendarEventRow(rpcRow(data))
}

export async function listAssignableUsers(client: SupabaseClient, projectId?: string): Promise<AssignableUser[]> {
  const { data, error } = await client.rpc('list_assignable_users', { target_project_id: projectId || null }) as unknown as RpcResult
  if (error) throw new Error('A kijelölhető felhasználók betöltése nem sikerült.')
  return rpcRows(data).map((row) => ({ id: typeof row.user_id === 'string' ? row.user_id : '', displayName: typeof row.display_name === 'string' ? row.display_name : '' }))
}

export async function listActiveUsers(client: SupabaseClient): Promise<AssignableUser[]> {
  const { data, error } = await client.rpc('list_active_users') as unknown as RpcResult
  if (error) throw new Error('A felhasználók betöltése nem sikerült.')
  return rpcRows(data).map((row) => ({ id: typeof row.user_id === 'string' ? row.user_id : '', displayName: typeof row.display_name === 'string' ? row.display_name : '' }))
}

export async function listEventParticipants(client: SupabaseClient, eventId: string): Promise<EventParticipant[]> {
  const { data, error } = await client.rpc('list_event_participants', { target_event_id: eventId }) as unknown as RpcResult
  if (error) throw new Error('A résztvevők betöltése nem sikerült.')
  return rpcRows(data).map((row) => {
    return { id: typeof row.participant_id === 'string' ? row.participant_id : '', eventId, userId: typeof row.user_id === 'string' ? row.user_id : null,
      status: row.status as ParticipantStatus, responseRequired: Boolean(row.response_required),
      displayName: typeof row.display_name === 'string' ? row.display_name : 'Külső résztvevő' }
  })
}

export async function inviteEventUser(client: SupabaseClient, eventId: string, userId: string): Promise<void> {
  const { error } = await client.rpc('invite_event_user', {
    target_event_id: eventId, participant_user_id: userId, response_is_required: true
  }) as unknown as RpcResult
  if (error) throw new Error(error.message || 'A meghívás nem sikerült.')
}

export async function respondToEvent(client: SupabaseClient, participantId: string, response: ParticipantStatus): Promise<void> {
  const { error } = await client.rpc('respond_to_event', { target_participant_id: participantId, response }) as unknown as RpcResult
  if (error) throw new Error(error.message || 'A válasz mentése nem sikerült.')
}

export async function listOwnAvailability(client: SupabaseClient): Promise<AvailabilityBlock[]> {
  const { data, error } = await client.from('availability_blocks').select('id,user_id,starts_at,ends_at').order('starts_at')
  if (error) throw new Error('A saját foglaltság betöltése nem sikerült.')
  return (data ?? []).map((row) => ({ id: String(row.id), userId: String(row.user_id), startsAt: String(row.starts_at), endsAt: String(row.ends_at) }))
}

export async function createAvailability(client: SupabaseClient, startsAt: string, endsAt: string): Promise<void> {
  const { error } = await client.rpc('create_availability_block', { block_starts_at: startsAt, block_ends_at: endsAt }) as unknown as RpcResult
  if (error) throw new Error(error.message || 'A foglaltság mentése nem sikerült.')
}

export async function cancelAvailability(client: SupabaseClient, blockId: string): Promise<void> {
  const { error } = await client.rpc('cancel_availability_block', { target_block_id: blockId }) as unknown as RpcResult
  if (error) throw new Error(error.message || 'A foglaltság törlése nem sikerült.')
}

export async function listBusySlots(client: SupabaseClient, start: Date, end: Date): Promise<BusySlot[]> {
  const { data, error } = await client.rpc('list_busy_slots', { range_starts_at: start.toISOString(), range_ends_at: end.toISOString() }) as unknown as RpcResult
  if (error) throw new Error('A foglaltsági nézet betöltése nem sikerült.')
  return rpcRows(data).map((row) => ({
    userId: typeof row.user_id === 'string' ? row.user_id : '', displayName: typeof row.display_name === 'string' ? row.display_name : '',
    startsAt: typeof row.starts_at === 'string' ? row.starts_at : '', endsAt: typeof row.ends_at === 'string' ? row.ends_at : ''
  }))
}
