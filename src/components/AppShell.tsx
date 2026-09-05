import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const items = [
  { to: '/', label: 'Kezdőlap' },
  { to: '/feladatok', label: 'Feladatok' },
  { to: '/naptar', label: 'Naptár' },
  { to: '/projektek', label: 'Projektek' }
]

export function AppShell() {
  const { signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Fő navigáció">
        <div className="brand" aria-label="RA Kommunikációs Platform">
          <span className="brand-logo-plate" aria-hidden="true">
            <img src="/brand/ratgeber-akademia-logo.png" alt="" />
          </span>
          <span className="brand-copy">
            <strong>Kommunikáció</strong>
            <small>belső platform</small>
          </span>
        </div>
        <nav>
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="secondary-button" onClick={() => void signOut()}>Kijelentkezés</button>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="topbar-title">
            <small>Rátgéber Kosárlabda Akadémia</small>
            <strong>Belső munkatér</strong>
          </span>
          <button className="icon-button" aria-label="Értesítések">0</button>
        </header>
        <Outlet />
      </div>
      <nav className="mobile-nav" aria-label="Mobil navigáció">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>{item.label}</NavLink>
        ))}
      </nav>
    </div>
  )
}
