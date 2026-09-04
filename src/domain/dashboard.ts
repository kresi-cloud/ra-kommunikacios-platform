import type { CalendarEvent } from './events'
import { budapestDayKey } from './events'
import type { Task } from './tasks'

export type DashboardMetrics = {
  awaitingAcceptance: number
  upcomingDeadlines: number
  todayEvents: number
}

export function calculateDashboardMetrics(
  tasks: Task[],
  events: CalendarEvent[],
  currentUserId: string,
  now = new Date()
): DashboardMetrics {
  const deadlineLimit = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const today = budapestDayKey(now)
  return {
    awaitingAcceptance: tasks.filter(task =>
      task.responsibleUserId === currentUserId && task.acceptanceStatus === 'pending'
    ).length,
    upcomingDeadlines: tasks.filter(task => task.dueAt !== null
      && new Date(task.dueAt) >= now
      && new Date(task.dueAt) <= deadlineLimit
    ).length,
    todayEvents: events.filter(event => budapestDayKey(event.startsAt) === today).length
  }
}

