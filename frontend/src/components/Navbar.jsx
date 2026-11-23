import { useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import './Navbar.css'

export default function Navbar() {
  const { currentUser, logout, openLoginModal, openRegisterModal } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    setOpen(false)
    navigate('/')
  }

  const isAdmin = currentUser?.role === 'ADMIN'

  // Onglets de gestion pour l'Administrateur
  const adminLinks = [
    { to: '/admin/statistiques', label: 'Statistiques' },
    { to: '/admin/voyages', label: 'Gestion Voyages' },
    { to: '/admin/reservations', label: 'Réservations' },
    { to: '/admin/participants', label: 'Participants' },
    { to: '/admin/transactions', label: 'Transactions' },
  ]

  // Liens pour les Voyageurs & Visiteurs
  const travelerLinks = [
    { to: '/', label: 'Accueil', end: true },
    { to: '/voyages', label: 'Voyages' },
    ...(currentUser?.role === 'VOYAGEUR'
      ? [{ to: '/mes-reservations', label: 'Mes réservations' }]
      : []),
    { to: '/about', label: 'À propos' },
    { to: '/contact', label: 'Contact' },
  ]

  const navLinks = isAdmin ? adminLinks : travelerLinks

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Logo / Brand unifié */}
        <Link
          to={isAdmin ? '/admin/statistiques' : '/'}
          className="navbar-brand"
          onClick={() => setOpen(false)}
        >
          <span className="navbar-brand-mark">✈</span>
          <span>TravelPlan</span>
          {isAdmin && <span className="navbar-role-pill">ADMIN</span>}
        </Link>

        {/* Liens de navigation dynamiques selon le rôle */}
        <nav className={`navbar-links ${open ? 'is-open' : ''}`}>
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end || l.to === '/admin/statistiques'}
              className={({ isActive }) =>
                'navbar-link' +
                (isActive ||
                (l.to === '/admin/statistiques' &&
                  (location.pathname === '/admin' || location.pathname === '/admin/statistiques'))
                  ? ' is-active'
                  : '')
              }
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}

          {/* Raccourci pour l'administrateur afin de prévisualiser le site public */}
          {isAdmin && (
            <Link
              to="/"
              className="navbar-link navbar-link-public"
              onClick={() => setOpen(false)}
              title="Prévisualiser le site public voyageur"
            >
              👁️ Site Public
            </Link>
          )}

          {/* Section Authentification & Profil */}
          <div className="navbar-auth">
            {isAdmin ? (
              <>
                <Link
                  to="/profil"
                  className="navbar-user navbar-user-admin"
                  onClick={() => setOpen(false)}
                  title="Profil Administrateur"
                >
                  <span className="navbar-admin-shield">🛡️</span>{' '}
                  {currentUser.firstName || 'Admin'}
                </Link>
                <button className="btn btn-outline" onClick={handleLogout}>
                  Déconnexion
                </button>
              </>
            ) : currentUser ? (
              <>
                <Link
                  to="/profil"
                  className="navbar-user"
                  onClick={() => setOpen(false)}
                >
                  {currentUser.firstName}
                </Link>
                <button className="btn btn-outline" onClick={handleLogout}>
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-outline navbar-login-btn"
                  onClick={() => {
                    setOpen(false)
                    openLoginModal()
                  }}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  className="btn btn-primary navbar-register-btn"
                  onClick={() => {
                    setOpen(false)
                    openRegisterModal()
                  }}
                >
                  Créer un compte
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Bouton Hamburger sur Mobile */}
        <button
          className="navbar-toggle"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
