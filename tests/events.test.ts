import { describe, expect, it } from 'vitest'
import { budapestDayKey, groupEventsByBudapestDay, parseCalendarEventRow, type CalendarEvent } from '../src/domain/events'

const event: CalendarEvent = {
  id: '60000000-0000-4000-8000-000000000001',
  eventCode: 'RA-EVT-2026-0001',
  title: 'Szezonnyitó sajtóesemény',
  description: null,
  eventType: 'press_event',
  responsibleUserId: '30000000-0000-4000-8000-000000000001',
  projectId: null,
  startsAt: '2026-09-03T22:30:00Z',
  endsAt: '2026-09-03T23:30:00Z',
  locationName: 'Akadémia',
  onlineUrl: null,
  isMandatory: true,
  status: 'scheduled',
  importanceForNamesake: false
}

describe('esemény domain', () => {
  it('Budapest szerint csoportosít az UTC napváltás körül is', () => {
    expect(budapestDayKey(event.startsAt)).toBe('2026-09-04')
    expect([...groupEventsByBudapestDay([event]).keys()]).toEqual(['2026-09-04'])
  })

  it('elutasítja a fordított időtartamot', () => {
    expect(() => parseCalendarEventRow({
      id: event.id, event_code: event.eventCode, title: event.title,
      event_type: event.eventType, responsible_user_id: event.responsibleUserId,
      starts_at: event.endsAt, ends_at: event.startsAt, is_mandatory: true,
      status: event.status, importance_for_namesake: false
    })).toThrow('Az esemény vége nem lehet korábbi')
  })
})
