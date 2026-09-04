import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <main className="centered-state" aria-live="polite">Betöltés…</main>
  if (!session) return <Navigate to="/belepes" replace state={{ from: location }} />
  return <Outlet />
}
