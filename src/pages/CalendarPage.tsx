import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelAvailability, createAvailability, createScheduledEvent, listAssignableUsers, listBusySlots, listCalendarEvents, listOwnAvailability } from '../api/events'
import { disconnectGoogleCalendar, getCalendarConnection } from '../api/calendarSync'
import { listProjects } from '../api/projects'
import { AvailabilityPanel } from '../components/AvailabilityPanel'
import { CalendarAgenda } from '../components/CalendarAgenda'
import { CalendarSyncPanel } from '../components/CalendarSyncPanel'
import { EventForm } from '../components/EventForm'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

const DAYS_AROUND_TODAY = 31

export function CalendarPage() {
  const [showForm, setShowForm] = useState(false); const [projectId, setProjectId] = useState('')
  const queryClient = useQueryClient(); const { session } = useAuth()
  const now = new Date()
  const rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const rangeEnd = new Date(now.getTime() + DAYS_AROUND_TODAY * 24 * 60 * 60 * 1000)
  const query = useQuery({
    queryKey: ['calendar', rangeStart.toISOString().slice(0, 10), rangeEnd.toISOString().slice(0, 10)],
    queryFn: () => {
      if (!supabase) throw new Error('A Supabase nincs konfigurálva.')
      return listCalendarEvents(supabase, rangeStart, rangeEnd)
    },
    enabled: Boolean(supabase)
  })
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => { if (!supabase) throw new Error(); return listProjects(supabase) }, enabled: Boolean(supabase && showForm) })
  const users = useQuery({ queryKey: ['assignable-users', projectId], queryFn: () => { if (!supabase) throw new Error(); return listAssignableUsers(supabase, projectId || undefined) }, enabled: Boolean(supabase && showForm) })
  const ownAvailability = useQuery({ queryKey: ['availability', 'own'], queryFn: () => { if (!supabase) throw new Error(); return listOwnAvailability(supabase) }, enabled: Boolean(supabase) })
  const busySlots = useQuery({ queryKey: ['availability', 'busy', rangeStart.toISOString().slice(0, 10)], queryFn: () => { if (!supabase) throw new Error(); return listBusySlots(supabase, rangeStart, rangeEnd) }, enabled: Boolean(supabase) })
  const calendarConnection = useQuery({ queryKey: ['calendar-connection'], queryFn: () => { if (!supabase) throw new Error(); return getCalendarConnection(supabase) }, enabled: Boolean(supabase) })
  const createEvent = useMutation({ mutationFn: async (input: Parameters<typeof createScheduledEvent>[1]) => { if (!supabase) throw new Error(); return createScheduledEvent(supabase, input) }, onSuccess: async () => { setShowForm(false); await queryClient.invalidateQueries({ queryKey: ['calendar'] }) } })
  const availability = useMutation({ mutationFn: async (operation: { type: 'create'; startsAt: string; endsAt: string } | { type: 'cancel'; id: string }) => { if (!supabase) throw new Error(); return operation.type === 'create' ? createAvailability(supabase, operation.startsAt, operation.endsAt) : cancelAvailability(supabase, operation.id) }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['availability'] }) } })
  const disconnect = useMutation({ mutationFn: async () => { if (!supabase) throw new Error(); return disconnectGoogleCalendar(supabase) }, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['calendar-connection'] }), queryClient.invalidateQueries({ queryKey: ['availability'] })]) } })

  return (
    <main className="page-content">
      <div className="page-heading">
        <div><p className="eyebrow">Europe/Budapest</p><h1>Naptár</h1></div>
        <button className="primary-button" onClick={() => setShowForm((value) => !value)}>Új esemény</button>
      </div>
      <p className="lead">Heti előzmény és a következő 31 nap eseményei, budapesti helyi időben.</p>
      {showForm && session && <EventForm projects={projects.data ?? []} users={users.data ?? [{ id: session.user.id, displayName: session.user.email ?? 'Saját magam' }]} currentUserId={session.user.id} busy={createEvent.isPending} onProjectChange={setProjectId} onSubmit={(input) => createEvent.mutateAsync(input)} onCancel={() => setShowForm(false)} />}
      {query.isPending && supabase && <p aria-live="polite">Naptár betöltése…</p>}
      {query.isError && <div className="error-banner" role="alert">A naptár betöltése nem sikerült.</div>}
      {!query.isPending && !query.isError && <CalendarAgenda events={query.data ?? []} />}
      {supabase && <AvailabilityPanel ownBlocks={ownAvailability.data ?? []} busySlots={busySlots.data ?? []} busy={availability.isPending} onCreate={(startsAt, endsAt) => availability.mutateAsync({ type: 'create', startsAt, endsAt })} onCancel={(id) => availability.mutateAsync({ type: 'cancel', id })} />}
      {supabase && <CalendarSyncPanel connection={calendarConnection.data ?? null} busy={disconnect.isPending} onDisconnect={() => disconnect.mutateAsync()} />}
      {!supabase && <div className="warning-banner">Az adatkapcsolat konfigurálásáig a naptár nem kér le üzleti adatot.</div>}
    </main>
  )
}
