import { Link } from 'react-router-dom'
import { taskStatusLabels, type Task, type TaskStatus } from '../domain/tasks'
import { formatBudapestDateTime } from '../lib/time'

const columns: { title: string; statuses: TaskStatus[] }[] = [
  { title: 'Kiosztva', statuses: ['draft', 'assigned'] },
  { title: 'Elfogadva / Folyamatban', statuses: ['accepted', 'in_progress'] },
  { title: 'Pontosításra vár', statuses: ['clarification_needed'] },
  { title: 'Blokkolt', statuses: ['blocked'] },
  { title: 'Felülvizsgálaton', statuses: ['in_review'] },
  { title: 'Befejezett', statuses: ['completed'] }
]

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="kanban" aria-label="Feladat Kanban">
      {columns.map((column) => {
        const items = tasks.filter((task) => column.statuses.includes(task.status))
        return (
          <section className="kanban-column" key={column.title}>
            <h2>{column.title} <span>{items.length}</span></h2>
            <div className="kanban-stack">
              {items.map((task) => (
                <Link className={`kanban-card priority-${task.priority}`} to={`/feladatok/${task.id}`} key={task.id}>
                  <span className="eyebrow">{task.taskCode}</span>
                  <strong>{task.title}</strong>
                  <small>{taskStatusLabels[task.status]} · {task.dueAt ? formatBudapestDateTime(task.dueAt) : 'Nincs határidő'}</small>
                </Link>
              ))}
              {items.length === 0 && <p className="column-empty">Nincs feladat</p>}
            </div>
          </section>
        )
      })}
    </div>
  )
}
