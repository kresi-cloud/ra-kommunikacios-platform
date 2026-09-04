import { describe, expect, it } from 'vitest'
import { parsePublicEnv } from '../src/lib/env'

describe('nyilvános környezeti konfiguráció', () => {
  it('a jelölőértékeket nem tekinti működő konfigurációnak', () => {
    expect(parsePublicEnv({ VITE_SUPABASE_URL: '[CONFIGURE_ME]', VITE_SUPABASE_ANON_KEY: '[CONFIGURE_ME]' })).toBeNull()
  })

  it('elutasítja a nem HTTPS Supabase URL-t', () => {
    expect(() => parsePublicEnv({ VITE_SUPABASE_URL: 'http://example.test', VITE_SUPABASE_ANON_KEY: 'a'.repeat(30) })).toThrow()
  })
})
