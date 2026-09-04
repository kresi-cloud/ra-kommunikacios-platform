import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelScheduledEvent, countEventConflicts, getCalendarEvent, getEventCapabilities, inviteEventUser, listActiveUsers, listEventParticipants, respondToEvent, updateScheduledEvent } from '../api/events'
import { useAuth } from '../auth/AuthProvider'
import { EventEditPanel } from '../components/EventEditPanel'
import { eventStatusLabels, eventTypeLabels, participantStatusLabels, type ParticipantStatus } from '../domain/events'
import { formatBudapestDateTime } from '../lib/time'
import { supabase } from '../lib/supabase'

export function EventDetailPage() {
  const { eventId = '' } = useParams(); const { session } = useAuth(); const queryClient = useQueryClient(); const [inviteeId, setInviteeId] = useState('')
  const event = useQuery({ queryKey: ['event', eventId], queryFn: () => { if (!supabase) throw new Error(); return getCalendarEvent(supabase, eventId) }, enabled: Boolean(supabase && eventId) })
  const capabilities = useQuery({ queryKey: ['event-capabilities', eventId], queryFn: () => { if (!supabase) throw new Error(); return getEventCapabilities(supabase, eventId) }, enabled: Boolean(supabase && eventId) })
  const participants = useQuery({ queryKey: ['event-participants', eventId], queryFn: () => { if (!supabase) throw new Error(); return listEventParticipants(supabase, eventId) }, enabled: Boolean(supabase && eventId) })
  const users = useQuery({ queryKey: ['active-users'], queryFn: () => { if (!supabase) throw new Error(); return listActiveUsers(supabase) }, enabled: Boolean(supabase && capabilities.data?.canManage) })
  const invite = useMutation({ mutationFn: (userId: string) => { if (!supabase) throw new Error(); return inviteEventUser(supabase, eventId, userId) }, onSuccess: async () => { setInviteeId(''); await queryClient.invalidateQueries({ queryKey: ['event-participants', eventId] }) } })
  const respond = useMutation({ mutationFn: ({ id, status }: { id: string; status: ParticipantStatus }) => { if (!supabase) throw new Error(); return respondToEvent(supabase, id, status) }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['event-participants', eventId] }) } })
  const update = useMutation({ mutationFn: (input: Parameters<typeof updateScheduledEvent>[2]) => { if (!supabase) throw new Error(); return updateScheduledEvent(supabase, eventId, input) }, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['event', eventId] }), queryClient.invalidateQueries({ queryKey: ['calendar'] }), queryClient.invalidateQueries({ queryKey: ['event-participants', eventId] })]) } })
  const cancel = useMutation({ mutationFn: (reason: string) => { if (!supabase) throw new Error(); return cancelScheduledEvent(supabase, eventId, reason) }, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['event', eventId] }), queryClient.invalidateQueries({ queryKey: ['calendar'] }), queryClient.invalidateQueries({ queryKey: ['event-capabilities', eventId] })]) } })
  if (event.isPending) return <main className="page-content"><p>Esemény betöltése…</p></main>
  if (event.isError || !event.data) return <main className="page-content"><div className="error-banner">Az esemény nem érhető el.</div></main>
  const item = event.data; const ownParticipant = participants.data?.find((participant) => participant.userId === session?.user.id && participant.responseRequired)
  return (
    <main className="page-content detail-page"><Link to="/naptar">← Vissza a naptárhoz</Link><div className="page-heading"><div><p className="eyebrow">{item.eventCode}</p><h1>{item.title}</h1></div><span className={`status-badge status-${item.status}`}>{eventStatusLabels[item.status]}</span></div>
      <p className="lead">{item.description || 'Nincs részletes leírás.'}</p>
      <dl className="detail-grid"><div><dt>Típus</dt><dd>{eventTypeLabels[item.eventType]}</dd></div><div><dt>Időpont</dt><dd>{formatBudapestDateTime(item.startsAt)} – {formatBudapestDateTime(item.endsAt)}</dd></div><div><dt>Helyszín</dt><dd>{item.locationName || (item.onlineUrl ? 'Online' : 'Nincs megadva')}</dd></div><div><dt>Részvétel</dt><dd>{item.isMandatory ? 'Kötelező' : 'Nem kötelező'}</dd></div></dl>
      {ownParticipant && <section className="action-panel"><h2>Részvételi válasz</h2><div className="button-row">{([['accepted', 'Elfogadom'], ['maybe', 'Talán'], ['declined', 'Nem veszek részt']] as const).map(([status, label]) => <button className="outline-button" disabled={respond.isPending} key={status} onClick={() => respond.mutate({ id: ownParticipant.id, status })}>{label}</button>)}</div></section>}
      <section className="action-panel"><h2>Résztvevők</h2>{participants.isPending ? <p>Betöltés…</p> : <ul className="simple-list">{(participants.data ?? []).map((participant) => <li key={participant.id}><strong>{participant.displayName}</strong><span>{participantStatusLabels[participant.status]}</span></li>)}</ul>}
        {capabilities.data?.canManage && <div className="invite-row"><select aria-label="Meghívandó felhasználó" value={inviteeId} onChange={(change) => setInviteeId(change.target.value)}><option value="">Válassz felhasználót</option>{(users.data ?? []).filter((user) => !(participants.data ?? []).some((participant) => participant.userId === user.id)).map((user) => <option value={user.id} key={user.id}>{user.displayName}</option>)}</select><button className="primary-button" disabled={!inviteeId || invite.isPending} onClick={() => invite.mutate(inviteeId)}>Meghívás</button></div>}
        {(invite.isError || respond.isError) && <p className="form-error">{invite.error?.message || respond.error?.message}</p>}
      </section>
      {item.status === 'scheduled' && capabilities.data?.canManage && <EventEditPanel key={`${item.title}-${item.startsAt}-${item.endsAt}-${item.locationName}-${item.isMandatory}`} item={item} busy={update.isPending || cancel.isPending} onCheckConflicts={(startsAt, endsAt) => { if (!supabase) throw new Error(); return countEventConflicts(supabase, eventId, startsAt, endsAt) }} onSubmit={(input) => update.mutateAsync(input)} onCancelEvent={(cancelReason) => cancel.mutateAsync(cancelReason)} />}
    </main>
  )
}
