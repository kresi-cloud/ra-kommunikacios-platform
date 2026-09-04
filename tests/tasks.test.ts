import { describe, expect, it } from 'vitest'
import { canResponsibleTransitionTask, isTaskOverdue, parseTaskRow, type Task } from '../src/domain/tasks'

const task: Task = {
  id: '50000000-0000-4000-8000-000000000001',
  taskCode: 'RA-TASK-2026-0001',
  title: 'Meghívó véglegesítése',
  description: null,
  responsibleUserId: '30000000-0000-4000-8000-000000000002',
  projectId: null,
  eventId: null,
  status: 'in_progress',
  acceptanceStatus: 'accepted',
  priority: 'normal',
  dueAt: '2026-09-04T06:00:00Z',
  unscheduled: false,
  requiresReview: false,
  reviewerUserId: null,
  updatedAt: '2026-09-04T05:00:00Z'
}

describe('feladat domain', () => {
  it('adatbázissorból doménobjektumot készít', () => {
    expect(parseTaskRow({
      id: task.id, task_code: task.taskCode, title: task.title,
      responsible_user_id: task.responsibleUserId, status: task.status,
      acceptance_status: task.acceptanceStatus, priority: task.priority,
      due_at: task.dueAt, unscheduled: false, requires_review: false,
      updated_at: task.updatedAt
    })).toEqual(task)
  })

  it('csak elfogadott, saját, nyitott és nem blokkolt feladatot jelez késésnek', () => {
    const now = new Date('2026-09-04T07:00:00Z')
    expect(isTaskOverdue(task, task.responsibleUserId, now)).toBe(true)
    expect(isTaskOverdue({ ...task, status: 'blocked' }, task.responsibleUserId, now)).toBe(false)
    expect(isTaskOverdue({ ...task, acceptanceStatus: 'pending' }, task.responsibleUserId, now)).toBe(false)
    expect(isTaskOverdue(task, '30000000-0000-4000-8000-000000000003', now)).toBe(false)
  })

  it('a felelősnek csak a szabályos átmeneteket engedi', () => {
    expect(canResponsibleTransitionTask('assigned', 'accepted')).toBe(true)
    expect(canResponsibleTransitionTask('assigned', 'completed')).toBe(false)
    expect(canResponsibleTransitionTask('in_progress', 'in_review', true)).toBe(true)
    expect(canResponsibleTransitionTask('in_progress', 'completed', true)).toBe(false)
  })
})

