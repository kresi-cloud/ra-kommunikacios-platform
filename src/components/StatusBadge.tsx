import { projectStatusLabels, type ProjectStatus } from '../domain/projects'

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`status-badge status-${status}`}>{projectStatusLabels[status]}</span>
}
