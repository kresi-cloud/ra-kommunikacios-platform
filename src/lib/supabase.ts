import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { publicEnv } from './env'

export const supabase: SupabaseClient | null = publicEnv
  ? createClient(publicEnv.VITE_SUPABASE_URL, publicEnv.VITE_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null
