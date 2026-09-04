import { describe, expect, it } from 'vitest'
import { canTransitionProject, projectSchema } from '../src/domain/projects'

const lead = { actor: 'communication_lead' as const, isOwner: false, hasActiveCriticalBlock: false }
const owner = { actor: 'project_owner' as const, isOwner: true, hasActiveCriticalBlock: false }

describe('projektállapotok', () => {
  it('a projektgazda aktiválhatja a saját tervezetét', () => {
    expect(canTransitionProject('draft', 'active', owner)).toBe(true)
  })

  it('a projektgazda nem archiválhat projektet', () => {
    expect(canTransitionProject('closed', 'archived', owner)).toBe(false)
  })

  it('aktív kritikus blokk mellett a projekt nem zárható le', () => {
    expect(canTransitionProject('active', 'closed', { ...lead, hasActiveCriticalBlock: true })).toBe(false)
  })

  it('újranyitáshoz vezetői indoklás kell', () => {
    expect(canTransitionProject('closed', 'active', lead)).toBe(false)
    expect(canTransitionProject('closed', 'active', { ...lead, reason: 'Új feladat érkezett.' })).toBe(true)
  })
})

describe('projektvalidáció', () => {
  it('elutasítja a kezdésnél korábbi befejezést', () => {
    const result = projectSchema.safeParse({
      id: '20000000-0000-4000-8000-000000000001',
      projectCode: 'RA-PROJ-2026-0001',
      title: 'Tesztprojekt',
      summary: null,
      objective: null,
      ownerUserId: '20000000-0000-4000-8000-000000000002',
      startsOn: '2026-09-10',
      endsOn: '2026-09-09',
      status: 'draft',
      seasonId: null,
      createdAt: '2026-09-04T08:00:00Z',
      updatedAt: '2026-09-04T08:00:00Z'
    })
    expect(result.success).toBe(false)
  })
})
