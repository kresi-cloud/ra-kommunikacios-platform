import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EventEditPanel } from '../src/components/EventEditPanel'
import { TaskEditPanel } from '../src/components/TaskEditPanel'
import type { CalendarEvent } from '../src/domain/events'
import type { Task } from '../src/domain/tasks'

const task: Task = {
  id: '50000000-0000-4000-8000-000000000001', taskCode: 'TASK-1', title: 'Tesztfeladat', description: null,
  responsibleUserId: '30000000-0000-4000-8000-000000000001', projectId: null, eventId: null,
  status: 'accepted', acceptanceStatus: 'accepted', priority: 'normal', dueAt: '2026-09-10T08:00:00.000Z',
  unscheduled: false, requiresReview: false, reviewerUserId: null, updatedAt: '2026-09-04T08:00:00.000Z'
}
const calendarEvent: CalendarEvent = {
  id: '60000000-0000-4000-8000-000000000001', eventCode: 'EVENT-1', title: 'Teszt esemény', description: 'Régi leírás',
  eventType: 'meeting', responsibleUserId: task.responsibleUserId, projectId: null,
  startsAt: '2026-09-10T08:00:00.000Z', endsAt: '2026-09-10T09:00:00.000Z', locationName: 'Akadémia',
  onlineUrl: null, isMandatory: false, status: 'scheduled', importanceForNamesake: false
}

describe('szerkesztőpanelek', () => {
  it('határidőt indoklás nélkül nem módosít', async () => {
    const change = vi.fn().mockResolvedValue(undefined); const user = userEvent.setup()
    render(<TaskEditPanel task={task} users={[]} canChangeDeadline canReassign={false} busy={false} onDeadlineChange={change} onReassign={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Határidő mentése' }))
    expect(screen.getByRole('alert')).toHaveTextContent('indoklás szükséges')
    expect(change).not.toHaveBeenCalled()
  })

  it('a csak leírást érintő eseménymódosítás megtartja a válaszokat', async () => {
    const submit = vi.fn().mockResolvedValue(undefined); const conflicts = vi.fn().mockResolvedValue(0); const user = userEvent.setup()
    render(<EventEditPanel item={calendarEvent} busy={false} onCheckConflicts={conflicts} onSubmit={submit} onCancelEvent={vi.fn()} />)
    await user.clear(screen.getByLabelText('Leírás')); await user.type(screen.getByLabelText('Leírás'), 'Új leírás')
    await user.click(screen.getByRole('button', { name: 'Módosítás mentése' }))
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ description: 'Új leírás', reason: undefined }))
    expect(conflicts).not.toHaveBeenCalled()
  })

  it('időpontütközésnél külön megerősítést kér, de engedi a mentést', async () => {
    const submit = vi.fn().mockResolvedValue(undefined); const conflicts = vi.fn().mockResolvedValue(2); const user = userEvent.setup()
    render(<EventEditPanel item={calendarEvent} busy={false} onCheckConflicts={conflicts} onSubmit={submit} onCancelEvent={vi.fn()} />)
    const start = screen.getByLabelText('Kezdés (budapesti idő)'); const end = screen.getByLabelText('Befejezés (budapesti idő)')
    await user.clear(start); await user.type(start, '2026-09-10T12:00'); await user.clear(end); await user.type(end, '2026-09-10T13:00')
    await user.type(screen.getByLabelText('Módosítás indoklása'), 'Átütemezés')
    await user.click(screen.getByRole('button', { name: 'Módosítás mentése' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('2 foglaltsággal')
    expect(submit).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Ütközés ellenére mentem' }))
    await user.click(screen.getByRole('button', { name: 'Megerősített módosítás mentése' }))
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ reason: 'Átütemezés' }))
  })
})
