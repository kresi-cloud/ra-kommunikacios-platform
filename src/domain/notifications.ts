import { z } from 'zod'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { APP_TIME_ZONE } from '../lib/time'

export const notificationPriorities = ['normal', 'critical'] as const
export type NotificationPriority = (typeof notificationPriorities)[number]

export const notificationSchema = z.object({
  id: z.uuid(),
  recipientUserId: z.uuid(),
  eventType: z.string().regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/),
  title: z.string().trim().min(1).max(250),
  bodySafe: z.string().max(2000).nullable(),
  priority: z.enum(notificationPriorities),
  entityType: z.string().min(1),
  entityId: z.uuid().nullable(),
  projectId: z.uuid().nullable(),
  readStatus: z.enum(['unread', 'read']),
  readAt: z.iso.datetime({ offset: true }).nullable(),
  deliverAfter: z.iso.datetime({ offset: true }),
  archivedAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true })
})

export type Notification = z.infer<typeof notificationSchema>

export function parseNotificationRow(row: Record<string, unknown>): Notification {
  return notificationSchema.parse({
    id: row.id,
    recipientUserId: row.recipient_user_id,
    eventType: row.event_type,
    title: row.title,
    bodySafe: row.body_safe ?? null,
    priority: row.priority,
    entityType: row.entity_type,
    entityId: row.entity_id ?? null,
    projectId: row.project_id ?? null,
    readStatus: row.read_status,
    readAt: row.read_at ?? null,
    deliverAfter: row.deliver_after,
    archivedAt: row.archived_at ?? null,
    createdAt: row.created_at
  })
}

export type NotificationPreference = {
  eventType: string
  emailEnabled: boolean
  pushEnabled: boolean
}

export function parseNotificationPreferenceRow(row: Record<string, unknown>): NotificationPreference {
  return {
    eventType: typeof row.event_type === 'string' ? row.event_type : '',
    emailEnabled: Boolean(row.email_enabled),
    pushEnabled: Boolean(row.push_enabled)
  }
}

export const notificationEventLabels: Record<string, string> = {
  'task.assigned': 'Új feladat',
  'task.reassigned': 'Feladat átadása',
  'task.accepted': 'Feladat elfogadva',
  'task.clarification_requested': 'Pontosításkérés',
  'task.blocked': 'Akadály vagy blokk',
  'task.unblocked': 'Blokk feloldása',
  'task.review_requested': 'Felülvizsgálatra átadás',
  'task.returned': 'Javításra visszaadás',
  'task.completed': 'Feladat befejezése',
  'task.reopened': 'Feladat újranyitása',
  'task.withdrawn': 'Feladat visszavonása',
  'task.deadline_changed': 'Határidő módosítása',
  'task.reminder_24h': '24 órás emlékeztető',
  'task.reminder_2h': '2 órás emlékeztető',
  'task.due': 'Határidő elérkezett',
  'task.overdue': 'Késedelmes feladat',
  'event.invited': 'Eseménymeghívás',
  'event.material_change': 'Lényeges eseményváltozás',
  'event.minor_change': 'Kisebb eseményváltozás',
  'event.cancelled': 'Esemény lemondása',
  'event.response': 'Részvételi válasz',
  'event.occurred': 'Esemény lezárult'
}

export function notificationEventLabel(eventType: string): string {
  return notificationEventLabels[eventType] ?? 'Rendszerüzenet'
}

/** A felhasználó által állítható normál értesítéstípusok a beállítási felületen. */
export const configurableNotificationTypes: string[] = Object.keys(notificationEventLabels)

const mandatoryFamilies = new Set(['security', 'account', 'permission', 'privacy'])

/** Biztonsági, fiók-, jogosultsági és adatvédelmi család nem kapcsolható ki. */
export function isMandatoryNotificationType(eventType: string): boolean {
  return mandatoryFamilies.has(eventType.split('.')[0] ?? '')
}

export function notificationTargetPath(notification: Pick<Notification, 'entityType' | 'entityId'>): string | null {
  if (!notification.entityId) return null
  if (notification.entityType === 'task') return `/feladatok/${notification.entityId}`
  if (notification.entityType === 'event') return `/naptar/${notification.entityId}`
  if (notification.entityType === 'project') return '/projektek'
  return null
}

/**
 * A szerveroldali `private.budapest_delivery_time` tükre: normál értesítés külső
 * kézbesítése csak 08:00–20:00 között történhet budapesti idő szerint; a kritikus
 * vagy azonnali jelölésű értesítés bármikor kimehet.
 */
export function computeDeliverAfter(
  createdAt: Date,
  priority: NotificationPriority,
  deliverImmediately = false
): Date {
  if (priority === 'critical' || deliverImmediately) return createdAt
  const localHour = Number(formatInTimeZone(createdAt, APP_TIME_ZONE, 'H'))
  if (localHour >= 8 && localHour < 20) return createdAt
  const localDay = formatInTimeZone(createdAt, APP_TIME_ZONE, 'yyyy-MM-dd')
  const eightToday = fromZonedTime(`${localDay}T08:00:00`, APP_TIME_ZONE)
  if (localHour < 8) return eightToday
  const nextDay = new Date(eightToday.getTime() + 36 * 60 * 60 * 1000)
  const nextLocalDay = formatInTimeZone(nextDay, APP_TIME_ZONE, 'yyyy-MM-dd')
  return fromZonedTime(`${nextLocalDay}T08:00:00`, APP_TIME_ZONE)
}

export function isExternalDeliveryDeferred(
  notification: Pick<Notification, 'deliverAfter'>,
  now = new Date()
): boolean {
  return new Date(notification.deliverAfter) > now
}

export function countUnread(notifications: Pick<Notification, 'readStatus' | 'archivedAt'>[]): number {
  return notifications.filter((item) => item.readStatus === 'unread' && item.archivedAt === null).length
}
