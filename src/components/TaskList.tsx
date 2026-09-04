import { formatBudapestDateTime } from '../lib/time'
import { taskStatusLabels, type Task } from '../domain/tasks'

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <section className="empty-state">
        <h2>Nincs nyitott feladat</h2>
        <p>A saját és a projekthatókörödben elérhető nyitott feladatok itt jelennek meg.</p>
      </section>
    )
  }

  return (
    <ul className="work-list" aria-label="Nyitott feladatok">
      {tasks.map((task) => (
        <li key={task.id} className={`work-card priority-${task.priority}`}>
          <div className="work-card-main">
            <div className="card-heading">
              <span className="eyebrow">{task.taskCode}</span>
              <span className={`status-badge task-${task.status}`}>{taskStatusLabels[task.status]}</span>
            </div>
            <h2>{task.title}</h2>
            <p>{task.description || 'Nincs részletes leírás.'}</p>
          </div>
          <dl className="work-meta">
            <div><dt>Prioritás</dt><dd>{task.priority === 'critical' ? 'Kritikus' : 'Normál'}</dd></div>
            <div><dt>Határidő</dt><dd>{task.dueAt ? formatBudapestDateTime(task.dueAt) : 'Nincs még ütemezve'}</dd></div>
            <div><dt>Felülvizsgálat</dt><dd>{task.requiresReview ? 'Szükséges' : 'Nem szükséges'}</dd></div>
          </dl>
        </li>
      ))}
    </ul>
  )
}

