import { Link } from 'react-router-dom'
import { apiLogout } from '../api'

type AppShellProps = {
  userEmail?: string | null
  onLogout?: () => void
  children: React.ReactNode
  showNav?: boolean
}

export default function AppShell({ userEmail, onLogout, children, showNav = true }: AppShellProps) {
  const handleLogout = async () => {
    await apiLogout()
    onLogout?.()
    window.location.href = '/login'
  }

  return (
    <div className="app-shell">
      {showNav ? (
        <header className="app-topbar">
          <Link to="/dashboard" className="app-brand">
            Placement Intelligence
          </Link>
          <div className="app-topbar-right">
            {userEmail ? <span>{userEmail}</span> : null}
            <button type="button" className="btn btn--ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
      ) : null}
      <main className="app-main">{children}</main>
    </div>
  )
}
