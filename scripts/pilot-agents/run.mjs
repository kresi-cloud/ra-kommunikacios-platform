// Napi pilot-forgatókönyv: valódi Supabase Auth fiókokkal, valódi RPC-hívásokkal
// használja a rendszert, ahogy egy kommunikációs vezető, egy projektgazda és
// egy munkatárs tenné egy átlagos napon. A cél kettős:
//   1. élő adatot és értesítést termel a TEST környezetben a pilot előtt;
//   2. minden futás magyar nyelvű, géppel is olvasható naplót ad, ami jelzi,
//      ha egy RPC vagy RLS-szabály menet közben megváltozott és eltört.
//
// Futtatás: npm run pilot:agents (a szükséges PILOT_* környezeti változókkal).
// Lásd: scripts/pilot-agents/README.md

import { createClient } from '@supabase/supabase-js'
import { readEnvConfig, readPersonas } from './personas.mjs'

const results = []
let hadFailure = false

function record(actor, action, ok, detail) {
  const line = `${ok ? '✅' : '❌'} [${actor}] ${action}${detail ? ` — ${detail}` : ''}`
  console.log(line)
  results.push({ actor, action, ok, detail })
  if (!ok) hadFailure = true
}

async function step(actor, action, fn, { critical = false } = {}) {
  try {
    const value = await fn()
    record(actor, action, true)
    return value
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    record(actor, action, false, message)
    if (critical) throw error
    return null
  }
}

function makeClient(supabaseUrl, supabaseAnonKey) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
}

async function signIn(client, actor, persona) {
  return step(actor, 'bejelentkezés', async () => {
    const { data, error } = await client.auth.signInWithPassword({
      email: persona.email,
      password: persona.password
    })
    if (error) throw new Error(error.message)
    return data.user
  }, { critical: true })
}

async function main() {
  const { supabaseUrl, supabaseAnonKey } = readEnvConfig()
  const { lead, owner, staff, admin } = readPersonas()

  const leadClient = makeClient(supabaseUrl, supabaseAnonKey)
  const ownerClient = makeClient(supabaseUrl, supabaseAnonKey)
  const staffClient = makeClient(supabaseUrl, supabaseAnonKey)
  const adminClient = admin ? makeClient(supabaseUrl, supabaseAnonKey) : null

  const leadUser = await signIn(leadClient, lead.roleHu, lead)
  const ownerUser = await signIn(ownerClient, owner.roleHu, owner)
  const staffUser = await signIn(staffClient, staff.roleHu, staff)
  const adminUser = admin ? await signIn(adminClient, admin.roleHu, admin) : null

  const runStamp = new Date().toISOString().replace(/[:.]/g, '-')
  const now = new Date()
  const taskDueAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
  const eventStartsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  const eventEndsAt = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString()

  // 1. A vezető projektet nyit, és feladatot oszt a projektgazdának.
  const project = await step(lead.roleHu, 'projekt létrehozása', async () => {
    const { data, error } = await leadClient.rpc('create_project', {
      project_title: `Pilot-ágens napi kör – ${runStamp}`,
      project_owner_user_id: ownerUser.id,
      project_summary: 'Automata pilot-forgatókönyv által létrehozott gyakorlóprojekt.'
    })
    if (error) throw new Error(error.message)
    return data
  })

  const task = project && await step(lead.roleHu, 'feladat kiosztása a projektgazdának', async () => {
    const { data, error } = await leadClient.rpc('create_task', {
      task_title: `Pilot-ágens feladat – ${runStamp}`,
      task_responsible_user_id: ownerUser.id,
      task_project_id: project.id,
      task_description: 'Automata pilot-forgatókönyv által kiosztott gyakorlófeladat.',
      task_due_at: taskDueAt,
      task_priority: 'normal',
      task_requires_review: false,
      task_reviewer_user_id: null,
      assign_immediately: true,
      critical_reason: null
    })
    if (error) throw new Error(error.message)
    return data
  })

  // 2. A projektgazda elfogadja a feladatot – ez értesíti a vezetőt.
  if (task) {
    await step(owner.roleHu, 'feladat elfogadása', async () => {
      const { error } = await ownerClient.rpc('transition_task', {
        target_task_id: task.id,
        target_status: 'accepted',
        transition_reason: null,
        new_due_at: null,
        confirm_existing_due: false
      })
      if (error) throw new Error(error.message)
    })
  }

  // 3. A projektgazda eseményt ütemez, és meghívja a munkatársat.
  const event = project && await step(owner.roleHu, 'esemény ütemezése', async () => {
    const { data, error } = await ownerClient.rpc('create_scheduled_event', {
      event_title: `Pilot-ágens egyeztetés – ${runStamp}`,
      event_kind: 'meeting',
      event_responsible_user_id: ownerUser.id,
      event_project_id: project.id,
      event_description: 'Automata pilot-forgatókönyv által ütemezett gyakorlóesemény.',
      event_starts_at: eventStartsAt,
      event_ends_at: eventEndsAt,
      event_location_name: 'Online',
      event_online_url: null,
      event_is_mandatory: false,
      event_response_due_at: null
    })
    if (error) throw new Error(error.message)
    return data
  })

  const participant = event && await step(owner.roleHu, 'munkatárs meghívása az eseményre', async () => {
    const { data, error } = await ownerClient.rpc('invite_event_user', {
      target_event_id: event.id,
      participant_user_id: staffUser.id,
      response_is_required: true
    })
    if (error) throw new Error(error.message)
    return data
  })

  // 4. A munkatárs elolvassa az értesítéseit, és válaszol a meghívásra.
  await step(staff.roleHu, 'olvasatlan értesítések száma', async () => {
    const { data, error } = await staffClient.rpc('count_unread_notifications')
    if (error) throw new Error(error.message)
    return String(data)
  })

  if (participant) {
    await step(staff.roleHu, 'részvétel visszaigazolása az eseményre', async () => {
      const { error } = await staffClient.rpc('respond_to_event', {
        target_participant_id: participant.id,
        response: 'accepted'
      })
      if (error) throw new Error(error.message)
    })
  }

  await step(staff.roleHu, 'összes értesítés olvasottá jelölése', async () => {
    const { error } = await staffClient.rpc('mark_all_notifications_read')
    if (error) throw new Error(error.message)
  })

  // 5. A vezető ellenőrzi, hogy megérkezett-e az elfogadási értesítés.
  await step(lead.roleHu, 'saját értesítések listázása', async () => {
    const { data, error } = await leadClient
      .from('notifications')
      .select('event_type,title,created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    if (error) throw new Error(error.message)
    return `${data.length} legutóbbi értesítés`
  })

  // 6. Negatív ellenőrzés: a technikai admin nem láthat projektet vagy feladatot.
  if (adminClient) {
    await step(admin.roleHu, 'RLS-ellenőrzés: nem láthat projektadatot', async () => {
      const { data, error } = await adminClient.from('projects').select('id').limit(1)
      if (error) throw new Error(error.message)
      if ((data ?? []).length > 0) {
        throw new Error('A technikai admin projektadatot látott – ez RLS-hiba volna.')
      }
    })
  }

  console.log('\n--- Összegzés ---')
  console.log(`Sikeres lépés: ${results.filter((r) => r.ok).length}/${results.length}`)
  if (hadFailure) {
    console.log('Volt sikertelen lépés — nézd át a fenti naplót.')
    process.exitCode = 1
  } else {
    console.log('Minden lépés sikeres volt.')
  }
}

main().catch((error) => {
  console.error('A pilot-forgatókönyv kritikus hibával leállt:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
