import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { countUnreadNotifications } from '../api/notifications'
import { supabase } from '../lib/supabase'

export function NotificationBell() {
  const query = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => { if (!supabase) throw new Error('A Supabase nincs konfigurálva.'); return countUnreadNotifications(supabase) },
    enabled: Boolean(supabase),
    refetchInterval: 60_000
  })
  const count = query.data ?? 0
  return (
    <Link className={`icon-button bell-link${count > 0 ? ' has-unread' : ''}`} to="/ertesitesek" aria-label={`Értesítések, ${count} olvasatlan`}>
      <span aria-hidden="true">{count}</span>
    </Link>
  )
}
