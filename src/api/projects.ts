import type { SupabaseClient } from '@supabase/supabase-js'
import { parseProjectRow, type Project } from '../domain/projects'

export async function listProjects(client: SupabaseClient): Promise<Project[]> {
  const { data, error } = await client
    .from('projects')
    .select('id,project_code,title,summary,objective,owner_user_id,starts_on,ends_on,status,season_id,created_at,updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) throw new Error('A projektek betöltése nem sikerült.')
  return (data ?? []).map((row) => parseProjectRow(row))
}
