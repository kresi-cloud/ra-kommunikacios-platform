/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'
import { authClient } from '../lib/auth-client'

// A `session` alak szándékosan a korábbi Supabase Session minimális
// részhalmazát tükrözi (session.user.id, session.user.email), hogy a még
// nem portolt oldalak (feladatok, naptár, értesítések – lásd
// docs/architecture-migration.md) változatlanul működjenek eddig a pontig.
type SessionUser = { id: string; email: string | null }
type Session = { user: SessionUser }

type AuthState = {
  session: Session | null
  loading: boolean
  configured: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const { data, isPending } = authClient.useSession()

  const value = useMemo<AuthState>(() => {
    const user = data?.user
    return {
      session: user ? { user: { id: user.id, email: user.email ?? null } } : null,
      loading: isPending,
      configured: true,
      signOut: async () => {
        await authClient.signOut()
      }
    }
  }, [data, isPending])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error('Az AuthProvider hiányzik.')
  return value
}
