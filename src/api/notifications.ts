import type { SupabaseClient } from '@supabase/supabase-js'
import {
  parseNotificationPreferenceRow, parseNotificationRow,
  type Notification, type NotificationPreference
} from '../domain/notifications'

const notificationColumns = 'id,recipient_user_id,event_type,title,body_safe,priority,entity_type,entity_id,project_id,read_status,read_at,deliver_after,archived_at,created_at'
type RpcResult = { data: unknown; error: { message?: string } | null }

function rpcRow(value: unknown): Record<string, unknown> {
  const row: unknown = Array.isArray(value) ? (value as unknown[])[0] : value
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Érvénytelen szerverválasz.')
  return row as Record<string, unknown>
}

export async function listNotifications(client: SupabaseClient, onlyUnread = false): Promise<Notification[]> {
  let query = client.from('notifications').select(notificationColumns).is('archived_at', null)
  if (onlyUnread) query = query.eq('read_status', 'unread')
  const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
  if (error) throw new Error('Az értesítések betöltése nem sikerült.')
  return (data ?? []).map((row) => parseNotificationRow(row))
}

export async function countUnreadNotifications(client: SupabaseClient): Promise<number> {
  const { data, error } = await client.rpc('count_unread_notifications') as unknown as RpcResult
  if (error) throw new Error('Az olvasatlan értesítések számolása nem sikerült.')
  return typeof data === 'number' ? data : Number(data) || 0
}

export async function markNotificationRead(client: SupabaseClient, notificationId: string): Promise<Notification> {
  const { data, error } = await client.rpc('mark_notification_read', {
    target_notification_id: notificationId
  }) as unknown as RpcResult
  if (error) throw new Error(error.message || 'Az értesítés olvasottá jelölése nem sikerült.')
  return parseNotificationRow(rpcRow(data))
}

export async function markAllNotificationsRead(client: SupabaseClient): Promise<number> {
  const { data, error } = await client.rpc('mark_all_notifications_read') as unknown as RpcResult
  if (error) throw new Error(error.message || 'Az értesítések olvasottá jelölése nem sikerült.')
  return typeof data === 'number' ? data : Number(data) || 0
}

export async function listNotificationPreferences(client: SupabaseClient): Promise<NotificationPreference[]> {
  const { data, error } = await client
    .from('notification_preferences')
    .select('event_type,email_enabled,push_enabled')
    .order('event_type')
  if (error) throw new Error('Az értesítési beállítások betöltése nem sikerült.')
  return (data ?? []).map((row) => parseNotificationPreferenceRow(row))
}

export async function setNotificationPreference(
  client: SupabaseClient,
  eventType: string,
  emailEnabled: boolean,
  pushEnabled: boolean
): Promise<NotificationPreference> {
  const { data, error } = await client.rpc('set_notification_preference', {
    target_event_type: eventType, enable_email: emailEnabled, enable_push: pushEnabled
  }) as unknown as RpcResult
  if (error) throw new Error(error.message || 'Az értesítési beállítás mentése nem sikerült.')
  return parseNotificationPreferenceRow(rpcRow(data))
}
