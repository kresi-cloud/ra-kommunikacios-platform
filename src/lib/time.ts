import { formatInTimeZone } from 'date-fns-tz'
import { hu } from 'date-fns/locale'

export const APP_TIME_ZONE = 'Europe/Budapest'

export function formatBudapestDateTime(value: string | Date): string {
  return formatInTimeZone(value, APP_TIME_ZONE, 'yyyy. MMMM d. HH:mm', { locale: hu })
}
