import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const { session, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setMessage('A belépés nem sikerült. Ellenőrizd az adatokat, vagy kérj segítséget.')
  }

  async function handleGoogleLogin() {
    if (!supabase) return
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) {
      setBusy(false)
      setMessage('A Google-belépés nem indítható el.')
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand"><span className="brand-mark">RA</span></div>
        <p className="eyebrow">Rátgéber Akadémia</p>
        <h1 id="login-title">Kommunikációs platform</h1>
        <p className="lead">Lépj be a meghívásodhoz tartozó fiókkal.</p>

        {!configured && (
          <div className="warning-banner" role="status">
            A fejlesztői környezet még nincs Supabase-projekthez kapcsolva. A belépés ezért nem aktív.
          </div>
        )}

        <button className="google-button" disabled={!configured || busy} onClick={() => void handleGoogleLogin()}>
          Belépés Google-fiókkal
        </button>

        <div className="separator"><span>vagy</span></div>

        <form onSubmit={(event) => void handlePasswordLogin(event)}>
          <label htmlFor="email">E-mail-cím</label>
          <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="password">Jelszó</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className="primary-button" type="submit" disabled={!configured || busy}>{busy ? 'Belépés…' : 'Belépés'}</button>
        </form>

        {message && <p className="form-error" role="alert">{message}</p>}
        <a className="support-link" href="mailto:[CONFIGURE_ME]">Elfelejtett jelszó vagy segítség</a>
        <p className="privacy-note">Nyilvános regisztráció nincs. A hozzáférés előzetes meghíváshoz kötött.</p>
      </section>
    </main>
  )
}
