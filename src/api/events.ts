import type { SupabaseClient } from '@supabase/supabase-js'
import { parseCalendarEventRow, type CalendarEvent } from '../domain/events'

export async function listCalendarEvents(
  client: SupabaseClient,
  rangeStart: Date,
  rangeEnd: Date
): Promise<CalendarEvent[]> {
  const { data, error } = await client
    .from('events')
    .select('id,event_code,title,event_type,responsible_user_id,project_id,starts_at,ends_at,location_name,online_url,is_mandatory,status,importance_for_namesake')
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

