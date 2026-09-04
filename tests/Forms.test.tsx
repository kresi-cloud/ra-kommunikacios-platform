import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskForm } from '../src/components/TaskForm'
import { EventForm } from '../src/components/EventForm'

const currentUserId = '30000000-0000-4000-8000-000000000001'
const users = [{ id: currentUserId, displayName: 'Teszt Elek' }]

describe('létrehozó űrlapok', () => {
  it('kritikus feladatot indoklás nélkül nem küld el', async () => {
    const submit = vi.fn().mockResolvedValue(undefined); const user = userEvent.setup()
    render(<TaskForm projects={[]} users={users} currentUserId={currentUserId} busy={false} onProjectChange={vi.fn()} onSubmit={submit} onCancel={vi.fn()} />)
    await user.type(screen.getByLabelText('Cím'), 'Kritikus közlemény')
    await user.selectOptions(screen.getByLabelText('Prioritás'), 'critical')
    await user.click(screen.getByRole('button', { name: 'Feladat kiosztása' }))
    expect(screen.getByRole('alert')).toHaveTextContent('indoklás szükséges')
    expect(submit).not.toHaveBeenCalled()
  })

  it('a budapesti eseményidőt UTC-re alakítja a mentéshez', async () => {
    const submit = vi.fn().mockResolvedValue(undefined); const user = userEvent.setup()
    render(<EventForm projects={[]} users={users} currentUserId={currentUserId} busy={false} onProjectChange={vi.fn()} onSubmit={submit} onCancel={vi.fn()} />)
    await user.type(screen.getByLabelText('Cím'), 'Sajtóesemény')
    await user.type(screen.getByLabelText('Kezdés (budapesti idő)'), '2026-09-10T10:00')
    await user.type(screen.getByLabelText('Befejezés (budapesti idő)'), '2026-09-10T11:30')
    await user.type(screen.getByLabelText('Helyszín'), 'Akadémia')
    await user.click(screen.getByRole('button', { name: 'Esemény ütemezése' }))
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ startsAt: '2026-09-10T08:00:00.000Z', endsAt: '2026-09-10T09:30:00.000Z' }))
  })
})
