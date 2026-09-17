// A saját Hono API-t hívja (server/routes/projects.ts) a korábbi
// Supabase-kliens helyett. A munkamenet-süti azonos origós, ezért elég a
// `credentials: 'same-origin'`; külön API-kulcs vagy kliensobjektum nem kell.
import { parseProjectRow, type Project, type ProjectStatus } from '../domain/projects'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }
  })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body ? String(body.error) : null
    throw new Error(message || 'A kérés nem sikerült.')
  }
  return body as T
}

export async function listProjects(): Promise<Project[]> {
  const data = await apiFetch<{ projects: Record<string, unknown>[] }>('/api/projects')
  return data.projects.map((row) => parseProjectRow(row))
}

export type CreateProjectInput = {
  title: string
  ownerUserId: string
  summary?: string | undefined
  objective?: string | undefined
  startsOn?: string | undefined
  endsOn?: string | undefined
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const data = await apiFetch<{ project: Record<string, unknown> }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return parseProjectRow(data.project)
}

export async function transitionProject(
  projectId: string, targetStatus: ProjectStatus, reason?: string
): Promise<Project> {
  const data = await apiFetch<{ project: Record<string, unknown> }>(`/api/projects/${projectId}/transition`, {
    method: 'POST',
    body: JSON.stringify({ targetStatus, reason: reason ?? null })
  })
  return parseProjectRow(data.project)
}
