import { Link } from 'react-router-dom'
import { Menu, LogIn } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import './MobileHeader.css'

export default function MobileHeader({ onToggleMenu }) {
  const { currentUser, openLoginModal } = useApp()

  const isAdmin = currentUser?.role === 'ADMIN'
  const userInitials = currentUser
    ? `${currentUser.firstName?.[0] || 'U'}${currentUser.lastName?.[0] || ''}`.toUpperCase()
    : 'U'

  return (
    <header className="mobile-header">
      <div className="mobile-header-left">
        <button
          type="button"
          className="mobile-header-menu-btn"
          onClick={onToggleMenu}
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link
          to={isAdmin ? '/admin/statistiques' : '/'}
          className="mobile-header-brand"
        >
          <span className="mobile-header-brand-mark">✈</span>
          <span className="mobile-header-brand-title">TravelPlan</span>
          {isAdmin && <span className="mobile-header-brand-badge">ADMIN</span>}
        </Link>
      </div>

      <div className="mobile-header-right">
        {currentUser ? (
          <Link to="/profil" className="mobile-header-avatar" title="Mon Profil">
            {userInitials}
          </Link>
        ) : (
          <button
            type="button"
            className="mobile-header-login-btn"
            onClick={openLoginModal}
            title="Connexion"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Connexion</span>
          </button>
        )}
      </div>
    </header>
  )
}
