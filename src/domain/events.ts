import { z } from 'zod'
import { formatInTimeZone } from 'date-fns-tz'
import { APP_TIME_ZONE } from '../lib/time'

export const eventStatuses = ['draft', 'scheduled', 'occurred', 'cancelled', 'postponed', 'archived'] as const
export type EventStatus = (typeof eventStatuses)[number]

export const eventStatusLabels: Record<EventStatus, string> = {
  draft: 'Tervezet',
  scheduled: 'Ütemezett',
  occurred: 'Megtörtént',
  cancelled: 'Lemondott',
  postponed: 'Átütemezett',
  archived: 'Archivált'
}

export const eventTypeLabels = {
  match: 'Mérkőzés',
  professional_program: 'Edzés vagy szakmai program',
  interview: 'Interjú',
  production: 'Forgatás vagy fotózás',
  press_event: 'Sajtóesemény',
  event: 'Rendezvény',
  meeting: 'Értekezlet',
  travel: 'Kiküldetés',
  conference: 'Konferencia',
  scientific_event: 'Tudományos esemény',
  other: 'Egyéb'
} as const

export const calendarEventSchema = z.object({
  id: z.uuid(),
  eventCode: z.string().min(1),
  title: z.string().trim().min(1).max(250),
  eventType: z.enum(Object.keys(eventTypeLabels) as [keyof typeof eventTypeLabels, ...(keyof typeof eventTypeLabels)[]]),
  responsibleUserId: z.uuid(),
  projectId: z.uuid().nullable(),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  locationName: z.string().nullable(),
  onlineUrl: z.string().nullable(),
  isMandatory: z.boolean(),
  status: z.enum(eventStatuses),
  importanceForNamesake: z.boolean()
}).refine(({ startsAt, endsAt }) => new Date(endsAt) > new Date(startsAt), {
  message: 'Az esemény vége nem lehet korábbi a kezdeténél.',
  path: ['endsAt']
})

export type CalendarEvent = z.infer<typeof calendarEventSchema>

export function parseCalendarEventRow(row: Record<string, unknown>): CalendarEvent {
  return calendarEventSchema.parse({
    id: row.id,
    eventCode: row.event_code,
    title: row.title,
    eventType: row.event_type,
    responsibleUserId: row.responsible_user_id,
    projectId: row.project_id ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    locationName: row.location_name ?? null,
    onlineUrl: row.online_url ?? null,
    isMandatory: row.is_mandatory,
    status: row.status,
    importanceForNamesake: row.importance_for_namesake
  })
}

export function budapestDayKey(value: string | Date): string {
  return formatInTimeZone(value, APP_TIME_ZONE, 'yyyy-MM-dd')
}

export function groupEventsByBudapestDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  return events.reduce((groups, event) => {
    const key = budapestDayKey(event.startsAt)
    groups.set(key, [...(groups.get(key) ?? []), event])
    return groups
  }, new Map<string, CalendarEvent[]>())
}

