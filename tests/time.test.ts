import { describe, expect, it } from 'vitest'
import { formatBudapestDateTime } from '../src/lib/time'

describe('Europe/Budapest időmegjelenítés', () => {
  it('figyelembe veszi a nyári időszámítást', () => {
    expect(formatBudapestDateTime('2026-09-04T08:00:00Z')).toContain('10:00')
  })
})
