import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TaskBoard } from '../src/components/TaskBoard'
import type { Task } from '../src/domain/tasks'

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
})
