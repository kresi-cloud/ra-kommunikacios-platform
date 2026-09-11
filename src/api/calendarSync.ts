import type { SupabaseClient } from '@supabase/supabase-js'

export const calendarConnectionStatuses = ['connected', 'error', 'revoked'] as const
export type CalendarConnectionStatus = (typeof calendarConnectionStatuses)[number]

export const calendarConnectionStatusLabels: Record<CalendarConnectionStatus, string> = {
  connected: 'Kapcsolódva',
  error: 'Szinkron nem teljes',
  revoked: 'Visszavonva'
}

export type CalendarConnection = {
  provider: 'google'
  calendarDisplayName: string | null
  status: CalendarConnectionStatus
  lastSyncAt: string | null
  syncErrorCode: string | null
}

type RpcResult = { data: unknown; error: { message?: string } | null }

function isConnectionStatus(value: unknown): value is CalendarConnectionStatus {
  return typeof value === 'string' && (calendarConnectionStatuses as readonly string[]).includes(value)
}

export async function getCalendarConnection(client: SupabaseClient): Promise<CalendarConnection | null> {
  const { data, error } = await client
    .from('calendar_connections')
    .select('provider,calendar_display_name,status,last_sync_at,sync_error_code')
    .eq('provider', 'google')
    .maybeSingle()
  if (error) throw new Error('A naptárkapcsolat betöltése nem sikerült.')
  if (!data) return null
  const row = data as Record<string, unknown>
  return {
    provider: 'google',
    calendarDisplayName: typeof row.calendar_display_name === 'string' ? row.calendar_display_name : null,
    status: isConnectionStatus(row.status) ? row.status : 'error',
    lastSyncAt: typeof row.last_sync_at === 'string' ? row.last_sync_at : null,
    syncErrorCode: typeof row.sync_error_code === 'string' ? row.sync_error_code : null
  }
}

export async function disconnectGoogleCalendar(client: SupabaseClient): Promise<void> {
  const { error } = await client.rpc('disconnect_google_calendar') as unknown as RpcResult
  if (error) throw new Error(error.message || 'A naptárkapcsolat visszavonása nem sikerült.')
}
