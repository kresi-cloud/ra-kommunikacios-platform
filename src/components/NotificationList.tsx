import {
  isExternalDeliveryDeferred, notificationEventLabel, notificationTargetPath, type Notification
} from '../domain/notifications'
import { formatBudapestDateTime } from '../lib/time'

export function NotificationList({ notifications, now = new Date(), busy = false, onOpen }: {
  notifications: Notification[]
  now?: Date
  busy?: boolean
  onOpen: (notification: Notification) => void
}) {
  if (notifications.length === 0) {
    return (
      <section className="empty-state">
        <h2>Nincs értesítés</h2>
        <p>Itt jelennek meg a feladataidhoz és eseményeidhez kapcsolódó értesítések. A külső csatornákra csak biztonságos, általános szöveg kerül.</p>
      </section>
    )
  }
  return (
    <ul className="notification-list">
      {notifications.map((notification) => {
        const target = notificationTargetPath(notification)
        const deferred = isExternalDeliveryDeferred(notification, now)
        const unread = notification.readStatus === 'unread'
        return (
          <li
            key={notification.id}
            className={`notification-item${unread ? ' unread' : ''}${notification.priority === 'critical' ? ' priority-critical' : ''}`}
          >
            <div className="notification-meta">
              <span className="notification-kind">{notificationEventLabel(notification.eventType)}</span>
              {notification.priority === 'critical' && <span className="status-badge task-blocked">Kritikus</span>}
              {unread && <span className="status-badge status-active">Olvasatlan</span>}
            </div>
            <h3>{notification.title}</h3>
            {notification.bodySafe && <p>{notification.bodySafe}</p>}
            <div className="notification-footer">
              <time dateTime={notification.createdAt}>{formatBudapestDateTime(notification.createdAt)}</time>
              {deferred && <small>Külső kézbesítés: {formatBudapestDateTime(notification.deliverAfter)}</small>}
              <button className="text-button" disabled={busy} onClick={() => onOpen(notification)}>
                {target ? 'Megnyitás' : 'Olvasottnak jelölöm'}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
