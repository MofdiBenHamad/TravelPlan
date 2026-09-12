import { NavLink } from 'react-router-dom'
import './AdminLayout.css'

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/voyages', label: 'Voyages' },
  { to: '/admin/participants', label: 'Participants' },
  { to: '/admin/paiements', label: 'Réservations & transactions' },
  { to: '/admin/messages', label: 'Messagerie' },
  { to: '/admin/avis', label: 'Avis voyageurs' },
]

export default function AdminLayout({ title, eyebrow, children }) {
  return (
    <section className="section">
      <div className="container admin-layout">
        <aside className="admin-sidebar">
          <span className="eyebrow">Espace admin</span>
          <nav className="admin-nav">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => 'admin-nav-link' + (isActive ? ' is-active' : '')}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="admin-content">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          {title && <h1>{title}</h1>}
          {children}
        </div>
      </div>
    </section>
  )
}