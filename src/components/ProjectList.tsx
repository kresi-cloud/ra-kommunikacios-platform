import type { Project } from '../domain/projects'
import { StatusBadge } from './StatusBadge'

export function ProjectList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <section className="empty-state">
        <h2>Még nincs elérhető projekt</h2>
        <p>Új projektet a kommunikációs vezető vagy a megfelelő többletjoggal rendelkező projektgazda hozhat létre.</p>
      </section>
    )
  }

  return (
    <ul className="project-grid" aria-label="Projektek">
      {projects.map((project) => (
        <li key={project.id} className="project-card">
          <div className="card-heading">
            <span className="eyebrow">{project.projectCode}</span>
            <StatusBadge status={project.status} />
          </div>
          <h2>{project.title}</h2>
          <p>{project.summary || 'Nincs rövid összefoglaló.'}</p>
        </li>
      ))}
    </ul>
  )
}
