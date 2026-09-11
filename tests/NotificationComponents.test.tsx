import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NotificationList } from '../src/components/NotificationList'
import { NotificationPreferences } from '../src/components/NotificationPreferences'
import type { Notification } from '../src/domain/notifications'

const notification: Notification = {
  id: '70000000-0000-4000-8000-000000000001',
  recipientUserId: '30000000-0000-4000-8000-000000000003',
  eventType: 'event.material_change',
  title: 'Módosult esemény: Sajtótájékoztató',
  bodySafe: 'Új időpont: 2026. 09. 15. 10:30.',
  priority: 'normal',
  entityType: 'event',
  entityId: '60000000-0000-4000-8000-000000000001',
  projectId: null,
  readStatus: 'unread',
  readAt: null,
  deliverAfter: '2026-09-11T06:00:00+00:00',
  archivedAt: null,
  createdAt: '2026-09-10T18:30:00+00:00'
}

describe('NotificationList', () => {
  it('érthető üres állapotot mutat', () => {
    render(<NotificationList notifications={[]} onOpen={() => undefined} />)
    expect(screen.getByRole('heading', { name: 'Nincs értesítés' })).toBeInTheDocument()
  })

  it('címkével, budapesti idővel és halasztott külső kézbesítéssel jelenít meg értesítést', async () => {
    const onOpen = vi.fn()
    render(<NotificationList notifications={[notification]} now={new Date('2026-09-10T18:31:00Z')} onOpen={onOpen} />)
    expect(screen.getByText('Módosult esemény: Sajtótájékoztató')).toBeInTheDocument()
    expect(screen.getByText('Lényeges eseményváltozás')).toBeInTheDocument()
    expect(screen.getByText('Olvasatlan')).toBeInTheDocument()
    expect(screen.getByText('2026. szeptember 10. 20:30')).toBeInTheDocument()
    expect(screen.getByText('Külső kézbesítés: 2026. szeptember 11. 08:00')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Megnyitás' }))
    expect(onOpen).toHaveBeenCalledWith(notification)
  })
})

describe('NotificationPreferences', () => {
  it('a kötelező típust zárolja, a normál típust menti', async () => {
    const onChange = vi.fn().mockResolvedValue(undefined)
    render(
      <NotificationPreferences
        preferences={[{ eventType: 'task.assigned', emailEnabled: true, pushEnabled: false }]}
        busy={false}
        eventTypes={['task.assigned', 'security.login_failed']}
        onChange={onChange}
      />
    )
    expect(screen.getByLabelText('Rendszerüzenet e-mail')).toBeDisabled()
    expect(screen.getByLabelText('Új feladat push')).not.toBeChecked()
    await userEvent.click(screen.getByLabelText('Új feladat e-mail'))
    expect(onChange).toHaveBeenCalledWith('task.assigned', false, false)
  })
})
