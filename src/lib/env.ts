import { z } from 'zod'

const publicEnvSchema = z.object({
  VITE_SUPABASE_URL: z.url().startsWith('https://'),
  VITE_SUPABASE_ANON_KEY: z.string().min(20),
  VITE_APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VITE_APP_TIMEZONE: z.literal('Europe/Budapest').default('Europe/Budapest')
})

export type PublicEnv = z.infer<typeof publicEnvSchema>

const isPlaceholder = (value: string | undefined) =>
  !value || value.trim() === '' || value.includes('[CONFIGURE_ME]')

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv | null {
  if (isPlaceholder(source.VITE_SUPABASE_URL) || isPlaceholder(source.VITE_SUPABASE_ANON_KEY)) {
    return null
  }

  const result = publicEnvSchema.safeParse(source)
  if (!result.success) {
    throw new Error('A nyilvános alkalmazáskonfiguráció hibás.')
  }
  return result.data
}

export const publicEnv = parsePublicEnv(import.meta.env)
