import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TaskList } from '../src/components/TaskList'
import type { Task } from '../src/domain/tasks'

const task: Task = {
  id: '50000000-0000-4000-8000-000000000001', taskCode: 'RA-TASK-2026-0001',
  title: 'Meghívó véglegesítése', description: null,
  responsibleUserId: '30000000-0000-4000-8000-000000000002', projectId: null, eventId: null,
  status: 'assigned', acceptanceStatus: 'pending', priority: 'critical',
  dueAt: '2026-09-04T08:00:00Z', unscheduled: false,
  requiresReview: true, reviewerUserId: '30000000-0000-4000-8000-000000000001',
  updatedAt: '2026-09-04T05:00:00Z'
}

describe('TaskList', () => {
  it('érthető üres állapotot mutat', () => {
    render(<TaskList tasks={[]} />)
    expect(screen.getByRole('heading', { name: 'Nincs nyitott feladat' })).toBeInTheDocument()
  })

  it('magyar állapottal és budapesti határidővel jelenít meg feladatot', () => {
    render(<TaskList tasks={[task]} />)
    expect(screen.getByText('Meghívó véglegesítése')).toBeInTheDocument()
    expect(screen.getByText('Kiosztva')).toBeInTheDocument()
    expect(screen.getByText('2026. szeptember 4. 10:00')).toBeInTheDocument()
  })
})

