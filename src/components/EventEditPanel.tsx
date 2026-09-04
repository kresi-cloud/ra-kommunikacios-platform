import { useState, type FormEvent } from 'react'
import type { UpdateEventInput } from '../api/events'
import type { CalendarEvent } from '../domain/events'
import { budapestInputToUtc, formatBudapestInput } from '../lib/time'

const formString = (data: FormData, name: string) => {
  const value = data.get(name)
  return typeof value === 'string' ? value : ''
}

export function EventEditPanel({ item, busy, onCheckConflicts, onSubmit, onCancelEvent }: {
  item: CalendarEvent; busy: boolean
  onCheckConflicts: (startsAt: string, endsAt: string) => Promise<number>
  onSubmit: (input: UpdateEventInput) => Promise<unknown>
  onCancelEvent: (reason: string) => Promise<unknown>
}) {
  const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  const [conflictCount, setConflictCount] = useState(0); const [confirmedConflicts, setConfirmedConflicts] = useState(false)
  const [showCancellation, setShowCancellation] = useState(false)
  const sameInstant = (left: string, right: string) => new Date(left).getTime() === new Date(right).getTime()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('')
    const data = new FormData(event.currentTarget)
    const title = formString(data, 'title').trim(); const startsInput = formString(data, 'startsAt'); const endsInput = formString(data, 'endsAt')
    const locationName = formString(data, 'locationName').trim(); const onlineUrl = formString(data, 'onlineUrl').trim()
    const description = formString(data, 'description').trim(); const reason = formString(data, 'reason').trim()
    if (!title || !startsInput || !endsInput) return setError('A cím, a kezdés és a befejezés kötelező.')
    if (!locationName && !onlineUrl) return setError('Helyszín vagy online elérés megadása kötelező.')
    const startsAt = budapestInputToUtc(startsInput); const endsAt = budapestInputToUtc(endsInput)
    if (new Date(endsAt) <= new Date(startsAt)) return setError('A befejezésnek a kezdés után kell lennie.')
    const isMandatory = data.get('isMandatory') === 'on'
    const timeChanged = !sameInstant(startsAt, item.startsAt) || !sameInstant(endsAt, item.endsAt)
    const important = timeChanged || locationName !== (item.locationName ?? '') || onlineUrl !== (item.onlineUrl ?? '') || isMandatory !== item.isMandatory
    if (important && !reason) return setError('A lényeges módosításhoz indoklás szükséges.')
    try {
      if (timeChanged && !confirmedConflicts) {
        const count = await onCheckConflicts(startsAt, endsAt)
        if (count > 0) { setConflictCount(count); return }
      }
      await onSubmit({ title, description: description || null, startsAt, endsAt, locationName: locationName || null, onlineUrl: onlineUrl || null, isMandatory, reason: reason || undefined })
      setConflictCount(0); setConfirmedConflicts(false); setSuccess(important ? 'A módosítás megtörtént; a résztvevőktől új visszaigazolást kérünk.' : 'Az esemény módosítása megtörtént.')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'A módosítás nem sikerült.') }
  }

  async function cancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('')
    const reason = formString(new FormData(event.currentTarget), 'cancellationReason').trim()
    if (!reason) return setError('A lemondás indoklása kötelező.')
    try { await onCancelEvent(reason); setShowCancellation(false); setSuccess('Az eseményt lemondtuk.') }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'A lemondás nem sikerült.') }
  }

  return (
    <section className="action-panel" aria-labelledby="event-edit-title">
      <h2 id="event-edit-title">Esemény módosítása</h2>
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor="event-edit-name">Cím</label><input id="event-edit-name" name="title" defaultValue={item.title} maxLength={250} />
        <label htmlFor="event-edit-description">Leírás</label><textarea id="event-edit-description" name="description" defaultValue={item.description ?? ''} rows={3} maxLength={10000} />
        <div className="form-grid">
          <div><label htmlFor="event-edit-start">Kezdés (budapesti idő)</label><input id="event-edit-start" name="startsAt" type="datetime-local" defaultValue={formatBudapestInput(item.startsAt)} /></div>
          <div><label htmlFor="event-edit-end">Befejezés (budapesti idő)</label><input id="event-edit-end" name="endsAt" type="datetime-local" defaultValue={formatBudapestInput(item.endsAt)} /></div>
          <div><label htmlFor="event-edit-location">Helyszín</label><input id="event-edit-location" name="locationName" defaultValue={item.locationName ?? ''} /></div>
          <div><label htmlFor="event-edit-online">Online hivatkozás</label><input id="event-edit-online" name="onlineUrl" type="url" defaultValue={item.onlineUrl ?? ''} /></div>
        </div>
        <label className="checkbox-label"><input name="isMandatory" type="checkbox" defaultChecked={item.isMandatory} /> Kötelező részvétel</label>
        <label htmlFor="event-change-reason">Módosítás indoklása</label><textarea id="event-change-reason" name="reason" rows={2} /><p className="form-help">Időpont, helyszín, online elérés vagy kötelező részvétel változásakor kötelező; ezek a résztvevői válaszokat alaphelyzetbe állítják.</p>
        {conflictCount > 0 && <div className="warning-banner" role="alert">Az új időpont {conflictCount} foglaltsággal vagy másik eseménnyel ütközik. Ellenőrizd az időpontot, vagy erősítsd meg a mentést.<div className="button-row"><button type="button" className="outline-button" onClick={() => { setConfirmedConflicts(true); setConflictCount(0) }}>Ütközés ellenére mentem</button></div></div>}
        <button className="primary-button" disabled={busy}>{busy ? 'Mentés…' : confirmedConflicts ? 'Megerősített módosítás mentése' : 'Módosítás mentése'}</button>
      </form>
      <div className="danger-zone"><button className="outline-button danger-button" type="button" onClick={() => setShowCancellation((value) => !value)}>Esemény lemondása</button>
        {showCancellation && <form onSubmit={(event) => void cancel(event)}><label htmlFor="cancellation-reason">Lemondás indoklása</label><textarea id="cancellation-reason" name="cancellationReason" rows={2} required /><button className="outline-button danger-button" disabled={busy}>Lemondás megerősítése</button></form>}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="success-message" role="status">{success}</p>}
    </section>
  )
}
