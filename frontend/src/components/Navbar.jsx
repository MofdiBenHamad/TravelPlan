import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import './Navbar.css'

export default function Navbar() {
  const { currentUser, logout, openLoginModal, openRegisterModal } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    setOpen(false)
    navigate('/')
  }

  const links = [
    { to: '/', label: 'Accueil' },
    { to: '/voyages', label: 'Voyages' },
    { to: '/about', label: 'À propos' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
          <span className="navbar-brand-mark">✈</span>
          TravelPlan
        </Link>

        <nav className={`navbar-links ${open ? 'is-open' : ''}`}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => 'navbar-link' + (isActive ? ' is-active' : '')}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}

          {currentUser?.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => 'navbar-link' + (isActive ? ' is-active' : '')}
              onClick={() => setOpen(false)}
            >
              Dashboard
            </NavLink>
          )}
          {currentUser?.role === 'VOYAGEUR' && (
            <NavLink
              to="/mes-reservations"
              className={({ isActive }) => 'navbar-link' + (isActive ? ' is-active' : '')}
              onClick={() => setOpen(false)}
            >
              Mes réservations
            </NavLink>
          )}

          <div className="navbar-auth">
            {currentUser ? (
              <>
                <Link to="/profil" className="navbar-user" onClick={() => setOpen(false)}>
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
