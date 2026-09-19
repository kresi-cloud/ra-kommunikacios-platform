import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { authClient } from '../lib/auth-client'
import { DEV_PERSONAS, type DevPersona } from '../../shared/dev-personas'

export function LoginPage() {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const { error } = await authClient.signIn.email({ email, password })
    setBusy(false)
    if (error) setMessage('A belépés nem sikerült. Ellenőrizd az adatokat, vagy kérj segítséget.')
  }

  async function handleDevLogin(persona: DevPersona) {
    setBusy(true)
    setMessage('')
    const { error } = await authClient.signIn.email({ email: persona.email, password: persona.password })
    setBusy(false)
    if (error) setMessage(`A fejlesztői gyorsbelépés nem sikerült (${persona.roleLabel}).`)
  }

  async function handleGoogleLogin() {
    setBusy(true)
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: window.location.origin
    })
    if (error) {
      setBusy(false)
      setMessage('A Google-belépés nem indítható el.')
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <img src="/brand/ratgeber-akademia-logo.png" alt="Rátgéber Kosárlabda Akadémia" />
          <span>Belső kommunikációs rendszer</span>
        </div>
        <p className="eyebrow">Rátgéber Kosárlabda Akadémia</p>
        <h1 id="login-title">Kommunikációs platform</h1>
        <p className="lead">Lépj be a meghívásodhoz tartozó fiókkal.</p>

        <button className="google-button" disabled={busy} onClick={() => void handleGoogleLogin()}>
          Belépés Google-fiókkal
        </button>

        <div className="separator"><span>vagy</span></div>

        <form onSubmit={(event) => void handlePasswordLogin(event)}>
          <label htmlFor="email">E-mail-cím</label>
          <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="password">Jelszó</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Belépés…' : 'Belépés'}</button>
        </form>

        {message && <p className="form-error" role="alert">{message}</p>}
        <a className="support-link" href="mailto:[CONFIGURE_ME]">Elfelejtett jelszó vagy segítség</a>
        <p className="privacy-note">Nyilvános regisztráció nincs. A hozzáférés előzetes meghíváshoz kötött.</p>

        {import.meta.env.DEV && (
          <div className="dev-login-panel">
            <p className="dev-login-title">Fejlesztői gyorsbelépés</p>
            <div className="dev-login-grid">
              {DEV_PERSONAS.map((persona) => (
                <button
                  key={persona.email}
                  type="button"
                  className="outline-button"
                  disabled={busy}
                  onClick={() => void handleDevLogin(persona)}
                >
                  {persona.roleLabel}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
