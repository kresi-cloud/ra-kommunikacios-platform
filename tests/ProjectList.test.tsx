import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProjectList } from '../src/components/ProjectList'
import type { Project } from '../src/domain/projects'

const project: Project = {
  id: '20000000-0000-4000-8000-000000000001',
  projectCode: 'RA-PROJ-2026-0001',
  title: 'Szezonnyitó kommunikáció',
  summary: 'Tesztösszefoglaló',
  objective: null,
  ownerUserId: '20000000-0000-4000-8000-000000000002',
  startsOn: null,
  endsOn: null,
  status: 'active',
  seasonId: null,
  createdAt: '2026-09-04T08:00:00Z',
  updatedAt: '2026-09-04T08:00:00Z'
}

describe('ProjectList', () => {
  it('érthető üres állapotot mutat', () => {
    render(<ProjectList projects={[]} />)
    expect(screen.getByRole('heading', { name: 'Még nincs elérhető projekt' })).toBeInTheDocument()
  })

  it('állapotnévvel együtt jeleníti meg a projektet', () => {
    render(<ProjectList projects={[project]} />)
    expect(screen.getByText('Szezonnyitó kommunikáció')).toBeInTheDocument()
    expect(screen.getByText('Aktív')).toBeInTheDocument()
  })
})
