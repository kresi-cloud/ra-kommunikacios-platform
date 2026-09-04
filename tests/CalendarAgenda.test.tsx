import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CalendarAgenda } from '../src/components/CalendarAgenda'
import type { CalendarEvent } from '../src/domain/events'

const event: CalendarEvent = {
  id: '60000000-0000-4000-8000-000000000001', eventCode: 'RA-EVT-2026-0001',
  title: 'Szezonnyitó sajtóesemény', eventType: 'press_event',
  responsibleUserId: '30000000-0000-4000-8000-000000000001', projectId: null,
  startsAt: '2026-09-04T08:00:00Z', endsAt: '2026-09-04T09:30:00Z',
  locationName: 'Akadémia', onlineUrl: null, isMandatory: true,
  status: 'scheduled', importanceForNamesake: true
}

describe('CalendarAgenda', () => {
  it('érthető üres állapotot mutat', () => {
    render(<CalendarAgenda events={[]} />)
    expect(screen.getByRole('heading', { name: 'Nincs esemény ebben az időszakban' })).toBeInTheDocument()
  })

  it('helyi idővel, típussal és kötelezőségjelzővel jelenít meg eseményt', () => {
    render(<CalendarAgenda events={[event]} />)
    expect(screen.getByText('10:00–11:30')).toBeInTheDocument()
    expect(screen.getByText('Sajtóesemény · Ütemezett')).toBeInTheDocument()
    expect(screen.getByText('Kötelező')).toBeInTheDocument()
  })
})

