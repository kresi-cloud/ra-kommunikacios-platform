import { describe, expect, it } from 'vitest'
import { calculateDashboardMetrics } from '../src/domain/dashboard'
import type { CalendarEvent } from '../src/domain/events'
import type { Task } from '../src/domain/tasks'

const userId = '30000000-0000-4000-8000-000000000002'
const baseTask: Task = {
  id: '50000000-0000-4000-8000-000000000001', taskCode: 'TASK-1', title: 'Feladat',
  description: null, responsibleUserId: userId, projectId: null, eventId: null,
  status: 'assigned', acceptanceStatus: 'pending', priority: 'normal',
  dueAt: '2026-09-04T12:00:00Z', unscheduled: false, requiresReview: false,
  reviewerUserId: null, updatedAt: '2026-09-04T06:00:00Z'
}
const baseEvent: CalendarEvent = {
  id: '60000000-0000-4000-8000-000000000001', eventCode: 'EVENT-1', title: 'Esemény',
  description: null,
  eventType: 'meeting', responsibleUserId: userId, projectId: null,
  startsAt: '2026-09-04T08:00:00Z', endsAt: '2026-09-04T09:00:00Z',
  locationName: 'Tárgyaló', onlineUrl: null, isMandatory: false,
  status: 'scheduled', importanceForNamesake: false
}

describe('kezdőlapi mutatók', () => {
  it('a saját visszaigazolást, 48 órás határidőt és budapesti mai eseményt számolja', () => {
    expect(calculateDashboardMetrics(
      [baseTask], [baseEvent], userId, new Date('2026-09-04T07:00:00Z')
    )).toEqual({ awaitingAcceptance: 1, upcomingDeadlines: 1, todayEvents: 1 })
  })
})
