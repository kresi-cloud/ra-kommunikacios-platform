import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { TaskBoard } from '../src/components/TaskBoard'
import { resolveBoardDropStatus, type Task } from '../src/domain/tasks'

const task: Task = {
  id: '50000000-0000-4000-8000-000000000001', taskCode: 'TASK-1', title: 'Sajtólista frissítése',
  description: null, responsibleUserId: '30000000-0000-4000-8000-000000000001', projectId: null, eventId: null,
  status: 'blocked', acceptanceStatus: 'obstacle_reported', priority: 'critical', dueAt: null, unscheduled: true,
  requiresReview: false, reviewerUserId: null, updatedAt: '2026-09-04T08:00:00Z'
}

describe('TaskBoard', () => {
  it('a feladatot a megfelelő magyar Kanban-oszlopba rendezi és az adatlapra linkeli', () => {
    render(<MemoryRouter><TaskBoard tasks={[task]} /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Blokkolt 1/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Sajtólista frissítése/ })).toHaveAttribute('href', `/feladatok/${task.id}`)
  })

  it('csak szabályos céloszlopot old fel', () => {
    const assigned = { ...task, status: 'assigned', acceptanceStatus: 'pending' } as Task
    expect(resolveBoardDropStatus(assigned, 'accepted')).toBe('accepted')
    expect(resolveBoardDropStatus(assigned, 'completed')).toBeNull()
  })

  it('a felelős szabályos húzását állapotváltásként elküldi', async () => {
    const accepted = { ...task, status: 'accepted', acceptanceStatus: 'accepted' } as Task
    const transition = vi.fn().mockResolvedValue(undefined)
    const data = new Map<string, string>()
    const dataTransfer = { setData: (type: string, value: string) => data.set(type, value), getData: (type: string) => data.get(type) ?? '', effectAllowed: 'none' }
    const { container } = render(<MemoryRouter><TaskBoard tasks={[accepted]} currentUserId={accepted.responsibleUserId} onTransition={transition} /></MemoryRouter>)
    fireEvent.dragStart(screen.getByRole('link', { name: /Sajtólista frissítése/ }), { dataTransfer })
    fireEvent.drop(container.querySelector('[data-column="in_progress"]') as Element, { dataTransfer })
    await waitFor(() => expect(transition).toHaveBeenCalledWith(accepted, 'in_progress', undefined))
  })
})
