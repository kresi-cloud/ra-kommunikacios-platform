import { useState } from 'react'
import { calendarConnectionStatusLabels, type CalendarConnection } from '../api/calendarSync'
import { formatBudapestDateTime } from '../lib/time'

export function CalendarSyncPanel({ connection, busy, onDisconnect }: {
  connection: CalendarConnection | null
  busy: boolean
  onDisconnect: () => Promise<void>
}) {
  const [error, setError] = useState('')
  async function disconnect() {
    setError('')
    try { await onDisconnect() }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'A visszavonás nem sikerült.') }
  }
  return (
    <section className="availability-panel">
      <div>
        <p className="eyebrow">Google Calendar</p>
        <h2>Naptárszinkron</h2>
        <p>A Google-naptárból kizárólag a foglalt idősávok kezdése, vége és egy biztonságos azonosító kerül át; cím, résztvevő és leírás nem tárolódik.</p>
      </div>
      {!connection && <p>Nincs összekapcsolt Google-naptár. A kapcsolat létrehozása a szerveroldali OAuth-beállítás után lesz elérhető.</p>}
      {connection && (
        <div className="simple-list">
          <div className="sync-row">
            <span>
              <strong>{connection.calendarDisplayName ?? 'Google-naptár'}</strong>
              <br />
              {connection.lastSyncAt ? `Utolsó szinkron: ${formatBudapestDateTime(connection.lastSyncAt)}` : 'Még nem volt szinkron.'}
              {connection.status === 'error' && connection.syncErrorCode && ` Hibakód: ${connection.syncErrorCode}.`}
            </span>
            <span className={`status-badge ${connection.status === 'connected' ? 'status-closed' : connection.status === 'error' ? 'task-clarification_needed' : 'status-archived'}`}>
              {calendarConnectionStatusLabels[connection.status]}
            </span>
          </div>
          {connection.status === 'error' && <p className="warning-banner" role="status">A szinkron nem teljes, az ütközésvizsgálat hiányos lehet.</p>}
          {connection.status !== 'revoked' && (
            <button className="outline-button" disabled={busy} onClick={() => void disconnect()}>Kapcsolat visszavonása</button>
          )}
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  )
}
