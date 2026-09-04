import { useState, type FormEvent } from 'react'
import type { AvailabilityBlock, BusySlot } from '../domain/events'
import { budapestInputToUtc, formatBudapestDateTime } from '../lib/time'

export function AvailabilityPanel({ ownBlocks, busySlots, busy, onCreate, onCancel }: {
  ownBlocks: AvailabilityBlock[]; busySlots: BusySlot[]; busy: boolean
  onCreate: (startsAt: string, endsAt: string) => Promise<void>; onCancel: (id: string) => Promise<void>
}) {
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); const data = new FormData(event.currentTarget)
    const startValue = data.get('startsAt'); const endValue = data.get('endsAt')
    const startsAt = budapestInputToUtc(typeof startValue === 'string' ? startValue : '')
    const endsAt = budapestInputToUtc(typeof endValue === 'string' ? endValue : '')
    if (new Date(endsAt) <= new Date(startsAt)) return setError('A befejezésnek a kezdés után kell lennie.')
    try { await onCreate(startsAt, endsAt); event.currentTarget.reset() }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'A mentés nem sikerült.') }
  }
  return (
    <section className="availability-panel">
      <div><p className="eyebrow">Privacy-safe elérhetőség</p><h2>Nem elérhető idősávok</h2><p>Mások csak a nevedet és a foglalt időt látják; részletes okot nem tárolunk.</p></div>
      <form className="compact-form" onSubmit={(event) => void submit(event)}>
        <div><label htmlFor="busy-start">Kezdés</label><input id="busy-start" name="startsAt" type="datetime-local" required /></div>
        <div><label htmlFor="busy-end">Befejezés</label><input id="busy-end" name="endsAt" type="datetime-local" required /></div>
        <button className="primary-button" disabled={busy}>Rögzítés</button>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
      <div className="availability-columns">
        <div><h3>Saját idősávok</h3>{ownBlocks.length === 0 ? <p>Nincs rögzített idősáv.</p> : <ul className="simple-list">{ownBlocks.map((block) => <li key={block.id}><span>{formatBudapestDateTime(block.startsAt)} – {formatBudapestDateTime(block.endsAt)}</span><button className="text-button" disabled={busy} onClick={() => void onCancel(block.id)}>Törlés</button></li>)}</ul>}</div>
        <div><h3>Csapat foglaltsága</h3>{busySlots.length === 0 ? <p>Nincs látható foglalt idősáv.</p> : <ul className="simple-list">{busySlots.map((slot, index) => <li key={`${slot.userId}-${slot.startsAt}-${index}`}><span><strong>{slot.displayName}</strong><br />{formatBudapestDateTime(slot.startsAt)} – {formatBudapestDateTime(slot.endsAt)}</span><span className="status-badge status-closed">Foglalt</span></li>)}</ul>}</div>
      </div>
    </section>
  )
}
