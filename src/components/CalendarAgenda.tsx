import { formatInTimeZone } from 'date-fns-tz'
import { hu } from 'date-fns/locale'
import { eventStatusLabels, eventTypeLabels, groupEventsByBudapestDay, type CalendarEvent } from '../domain/events'
import { APP_TIME_ZONE } from '../lib/time'

export function CalendarAgenda({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return (
      <section className="empty-state">
        <h2>Nincs esemény ebben az időszakban</h2>
        <p>A meghívásaid, saját eseményeid és a projekthatóköröd eseményei itt jelennek meg.</p>
      </section>
    )
  }

  const groups = groupEventsByBudapestDay(events)
  return (
    <div className="agenda" aria-label="Naptári események">
      {[...groups.entries()].map(([day, dayEvents]) => (
        <section key={day} className="agenda-day">
          <h2>{formatInTimeZone(`${day}T12:00:00Z`, APP_TIME_ZONE, 'yyyy. MMMM d., EEEE', { locale: hu })}</h2>
          <ul className="agenda-list">
            {dayEvents.map((event) => (
              <li key={event.id} className="agenda-item">
                <time dateTime={event.startsAt}>
                  {formatInTimeZone(event.startsAt, APP_TIME_ZONE, 'HH:mm')}–{formatInTimeZone(event.endsAt, APP_TIME_ZONE, 'HH:mm')}
                </time>
                <div>
                  <strong>{event.title}</strong>
                  <span>{eventTypeLabels[event.eventType]} · {eventStatusLabels[event.status]}</span>
                  <span>{event.locationName || (event.onlineUrl ? 'Online' : 'Helyszín nincs megadva')}</span>
                </div>
                {event.isMandatory && <span className="mandatory-label">Kötelező</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

