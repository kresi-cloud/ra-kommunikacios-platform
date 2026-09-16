import { useState } from 'react'
import {
  configurableNotificationTypes, isMandatoryNotificationType, notificationEventLabel,
  type NotificationPreference
} from '../domain/notifications'

export function NotificationPreferences({ preferences, busy, eventTypes = configurableNotificationTypes, onChange }: {
  preferences: NotificationPreference[]
  busy: boolean
  eventTypes?: string[]
  onChange: (eventType: string, emailEnabled: boolean, pushEnabled: boolean) => Promise<void>
}) {
  const [error, setError] = useState('')
  const stored = new Map(preferences.map((preference) => [preference.eventType, preference]))

  async function update(eventType: string, emailEnabled: boolean, pushEnabled: boolean) {
    setError('')
    try { await onChange(eventType, emailEnabled, pushEnabled) }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'A beállítás mentése nem sikerült.') }
  }

  return (
    <section className="availability-panel">
      <div>
        <p className="eyebrow">Külső csatornák</p>
        <h2>Értesítési beállítások</h2>
        <p>Az alkalmazáson belüli értesítés mindig megjelenik. A kritikus, biztonsági, fiók- és jogosultsági értesítés nem kapcsolható ki. Normál értesítés külső csatornán csak 08:00 és 20:00 között megy ki.</p>
      </div>
      <div className="table-scroll">
        <table className="preferences-table">
          <thead><tr><th scope="col">Értesítés</th><th scope="col">E-mail</th><th scope="col">Push</th></tr></thead>
          <tbody>
            {eventTypes.map((eventType) => {
              const preference = stored.get(eventType) ?? { eventType, emailEnabled: true, pushEnabled: true }
              const locked = isMandatoryNotificationType(eventType)
              const label = notificationEventLabel(eventType)
              return (
                <tr key={eventType}>
                  <th scope="row">{label}{locked && <small> (kötelező)</small>}</th>
                  <td>
                    <input
                      type="checkbox" aria-label={`${label} e-mail`} checked={preference.emailEnabled}
                      disabled={busy || locked}
                      onChange={(event) => void update(eventType, event.target.checked, preference.pushEnabled)}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox" aria-label={`${label} push`} checked={preference.pushEnabled}
                      disabled={busy || locked}
                      onChange={(event) => void update(eventType, preference.emailEnabled, event.target.checked)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  )
}
