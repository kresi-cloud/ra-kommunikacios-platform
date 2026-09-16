import { describe, expect, it } from 'vitest'
import {
  computeDeliverAfter, countUnread, isMandatoryNotificationType, notificationEventLabel,
  notificationTargetPath, parseNotificationRow, type Notification
} from '../src/domain/notifications'

const notification: Notification = {
  id: '70000000-0000-4000-8000-000000000001',
  recipientUserId: '30000000-0000-4000-8000-000000000003',
  eventType: 'task.assigned',
  title: 'Új feladat: Meghívó véglegesítése',
  bodySafe: 'Kiosztottak neked egy feladatot.',
  priority: 'normal',
  entityType: 'task',
  entityId: '50000000-0000-4000-8000-000000000001',
  projectId: null,
  readStatus: 'unread',
  readAt: null,
  deliverAfter: '2026-09-10T17:30:00+00:00',
  archivedAt: null,
  createdAt: '2026-09-10T17:30:00+00:00'
}

describe('értesítési domain', () => {
  it('adatbázissorból doménobjektumot készít', () => {
    expect(parseNotificationRow({
      id: notification.id, recipient_user_id: notification.recipientUserId, event_type: notification.eventType,
      title: notification.title, body_safe: notification.bodySafe, priority: 'normal', entity_type: 'task',
      entity_id: notification.entityId, read_status: 'unread', deliver_after: notification.deliverAfter,
      created_at: notification.createdAt
    })).toEqual(notification)
  })

  it('TC-NOT-001: 19:30-kor keletkezett normál értesítés azonnal kézbesíthető', () => {
    expect(computeDeliverAfter(new Date('2026-09-10T17:30:00Z'), 'normal').toISOString()).toBe('2026-09-10T17:30:00.000Z')
  })

  it('TC-NOT-002: 20:01 után keletkezett normál értesítés a következő 08:00-ra halasztódik', () => {
    expect(computeDeliverAfter(new Date('2026-09-10T18:01:00Z'), 'normal').toISOString()).toBe('2026-09-11T06:00:00.000Z')
  })

  it('hajnali normál értesítés aznap 08:00-kor kézbesíthető', () => {
    expect(computeDeliverAfter(new Date('2026-09-11T03:15:00Z'), 'normal').toISOString()).toBe('2026-09-11T06:00:00.000Z')
  })

  it('TC-NOT-003: kritikus és azonnali értesítés éjjel is azonnal kimegy', () => {
    expect(computeDeliverAfter(new Date('2026-09-11T00:00:00Z'), 'critical').toISOString()).toBe('2026-09-11T00:00:00.000Z')
    expect(computeDeliverAfter(new Date('2026-09-11T00:00:00Z'), 'normal', true).toISOString()).toBe('2026-09-11T00:00:00.000Z')
  })

  it('TC-NOT-013: az óraátállítás után is helyi 08:00-ra számol', () => {
    expect(computeDeliverAfter(new Date('2026-10-24T20:30:00Z'), 'normal').toISOString()).toBe('2026-10-25T07:00:00.000Z')
  })

  it('magyar címkét és célútvonalat ad', () => {
    expect(notificationEventLabel('task.assigned')).toBe('Új feladat')
    expect(notificationEventLabel('security.login_failed')).toBe('Rendszerüzenet')
    expect(notificationTargetPath(notification)).toBe('/feladatok/50000000-0000-4000-8000-000000000001')
    expect(notificationTargetPath({ entityType: 'event', entityId: '60000000-0000-4000-8000-000000000001' })).toBe('/naptar/60000000-0000-4000-8000-000000000001')
    expect(notificationTargetPath({ entityType: 'system', entityId: null })).toBeNull()
  })

  it('TC-NOT-010: a kötelező családot felismeri', () => {
    expect(isMandatoryNotificationType('security.login_failed')).toBe(true)
    expect(isMandatoryNotificationType('account.expired')).toBe(true)
    expect(isMandatoryNotificationType('task.assigned')).toBe(false)
  })

  it('csak az aktív olvasatlan értesítést számolja', () => {
    expect(countUnread([
      notification,
      { ...notification, readStatus: 'read' },
      { ...notification, archivedAt: '2026-09-18T00:00:00+00:00' }
    ])).toBe(1)
  })
})
