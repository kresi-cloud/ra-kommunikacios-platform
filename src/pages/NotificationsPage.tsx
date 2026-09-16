import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listNotificationPreferences, listNotifications, markAllNotificationsRead,
  markNotificationRead, setNotificationPreference
} from '../api/notifications'
import { NotificationList } from '../components/NotificationList'
import { NotificationPreferences } from '../components/NotificationPreferences'
import { notificationTargetPath, type Notification } from '../domain/notifications'
import { supabase } from '../lib/supabase'

export function NotificationsPage() {
  const [onlyUnread, setOnlyUnread] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const list = useQuery({
    queryKey: ['notifications', 'list', onlyUnread],
    queryFn: () => { if (!supabase) throw new Error('A Supabase nincs konfigurálva.'); return listNotifications(supabase, onlyUnread) },
    enabled: Boolean(supabase)
  })
  const preferences = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => { if (!supabase) throw new Error('A Supabase nincs konfigurálva.'); return listNotificationPreferences(supabase) },
    enabled: Boolean(supabase)
  })
  const invalidateNotifications = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  const open = useMutation({
    mutationFn: (notification: Notification) => { if (!supabase) throw new Error(); return markNotificationRead(supabase, notification.id) },
    onSuccess: async (_result, notification) => {
      await invalidateNotifications()
      const target = notificationTargetPath(notification)
      if (target) void navigate(target)
    }
  })
  const markAll = useMutation({
    mutationFn: () => { if (!supabase) throw new Error(); return markAllNotificationsRead(supabase) },
    onSuccess: invalidateNotifications
  })
  const savePreference = useMutation({
    mutationFn: ({ eventType, emailEnabled, pushEnabled }: { eventType: string; emailEnabled: boolean; pushEnabled: boolean }) => {
      if (!supabase) throw new Error()
      return setNotificationPreference(supabase, eventType, emailEnabled, pushEnabled)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
  })
  const unreadCount = (list.data ?? []).filter((notification) => notification.readStatus === 'unread').length

  return (
    <main className="page-content">
      <div className="page-heading">
        <div><p className="eyebrow">Alkalmazáson belül</p><h1>Értesítések</h1></div>
        <button className="outline-button" disabled={markAll.isPending || unreadCount === 0} onClick={() => markAll.mutate()}>
          Mindet olvasottnak jelölöm
        </button>
      </div>
      <p className="lead">Az utolsó 7 nap értesítései; a kritikus olvasatlan értesítés nem archiválódik automatikusan.</p>
      <div className="view-switch" role="group" aria-label="Szűrés">
        <button className={onlyUnread ? '' : 'active'} onClick={() => setOnlyUnread(false)}>Mind</button>
        <button className={onlyUnread ? 'active' : ''} onClick={() => setOnlyUnread(true)}>Olvasatlan</button>
      </div>
      {list.isPending && supabase && <p aria-live="polite">Értesítések betöltése…</p>}
      {list.isError && <div className="error-banner" role="alert">Az értesítések betöltése nem sikerült.</div>}
      {(open.isError || markAll.isError) && <div className="error-banner" role="alert">Az értesítés frissítése nem sikerült.</div>}
      {!list.isPending && !list.isError && <NotificationList notifications={list.data ?? []} busy={open.isPending} onOpen={(notification) => open.mutate(notification)} />}
      {supabase && <NotificationPreferences preferences={preferences.data ?? []} busy={savePreference.isPending} onChange={(eventType, emailEnabled, pushEnabled) => savePreference.mutateAsync({ eventType, emailEnabled, pushEnabled }).then(() => undefined)} />}
      {!supabase && <div className="warning-banner">Az adatkapcsolat konfigurálásáig az értesítések nem kérdezhetők le.</div>}
    </main>
  )
}
