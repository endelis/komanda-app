import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './AppShell.css'

const NAV_COACH = [
  { to: '/team',        labelKey: 'nav.team'        },
  { to: '/calendar',    labelKey: 'nav.calendar'    },
  { to: '/attendance',  labelKey: 'nav.attendance'  },
  { to: '/performance', labelKey: 'nav.performance' },
]

const NAV_ADMIN = [
  { to: '/admin',       labelKey: 'nav.admin'       },
  { to: '/team',        labelKey: 'nav.team'        },
  { to: '/calendar',    labelKey: 'nav.calendar'    },
  { to: '/attendance',  labelKey: 'nav.attendance'  },
  { to: '/performance', labelKey: 'nav.performance' },
]

const NAV_FAMILY = [
  { to: '/home',       labelKey: 'nav.home'       },
]

function navItems(role) {
  if (role === 'superadmin') return NAV_ADMIN
  if (role === 'coach')      return NAV_COACH
  return NAV_FAMILY
}

export default function AppShell({ children }) {
  const { t } = useTranslation()
  const { role, signOut } = useAuth()
  const navigate = useNavigate()
  const items = navItems(role)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="shell__logo">
          <span className="shell__mark">K</span>
          <span className="shell__wordmark">KOMANDA</span>
        </div>

        <nav className="shell__nav">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `shell__nav-item${isActive ? ' active' : ''}`}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <button className="shell__signout" onClick={handleSignOut}>
          {t('app.sign_out')}
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="shell__topbar">
        <span className="shell__topbar-logo">
          <span className="shell__mark shell__mark--sm">K</span>
          <span className="shell__wordmark">KOMANDA</span>
        </span>
        <button className="shell__signout shell__signout--top" onClick={handleSignOut}>
          {t('app.sign_out')}
        </button>
      </header>

      <main className="shell__main">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="shell__tabs">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `shell__tab${isActive ? ' active' : ''}`}
          >
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
