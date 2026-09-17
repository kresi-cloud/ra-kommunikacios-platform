import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../src/auth/AuthProvider'
import { LoginPage } from '../src/pages/LoginPage'

describe('LoginPage', () => {
  it('nem kínál nyilvános regisztrációt', () => {
    render(<MemoryRouter><AuthProvider><LoginPage /></AuthProvider></MemoryRouter>)
    expect(screen.queryByRole('button', { name: /regisztr/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Nyilvános regisztráció nincs/)).toBeInTheDocument()
  })

  it('a saját háttérrendszer mindig elérhető, ezért a belépés alapból engedélyezett', () => {
    render(<MemoryRouter><AuthProvider><LoginPage /></AuthProvider></MemoryRouter>)
    expect(screen.getByRole('button', { name: /^Belépés$/ })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /Google-fiókkal/ })).not.toBeDisabled()
  })
})
