import { useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Compass,
  Plane,
  Ticket,
  CalendarCheck,
  BarChart3,
  Users,
  Receipt,
  MessageSquare,
  Star,
  Info,
  Mail,
  LogOut,
  LogIn,
  UserPlus,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import './Sidebar.css'

export default function Sidebar({ mobileOpen, onClose }) {
  const { currentUser, logout, openLoginModal, openRegisterModal } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const isAdmin = currentUser?.role === 'ADMIN'

  // Fermer le tiroir mobile avec la touche Échap
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, onClose])

  // Verrouiller le scroll du body quand le tiroir mobile est ouvert
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  function handleLogout() {
    logout()
    onClose()
    navigate('/')
  }

  // Initiales de l'utilisateur
  const userInitials = currentUser
    ? `${currentUser.firstName?.[0] || 'U'}${currentUser.lastName?.[0] || ''}`.toUpperCase()
    : 'U'

  const userName = currentUser
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Utilisateur'
    : 'Invité'

  // Liens pour les Voyageurs & Visiteurs
  const travelerNavSections = [
    {
      title: 'NAVIGATION',
      links: [
        { to: '/', label: 'Accueil', icon: Home, end: true },
        { to: '/voyages', label: 'Voyages & Circuits', icon: Compass },
        ...(currentUser?.role === 'VOYAGEUR'
          ? [{ to: '/mes-reservations', label: 'Mes Réservations', icon: Ticket }]
          : []),
      ],
    },
    {
      title: 'DÉCOUVRIR',
      links: [
        { to: '/about', label: 'À propos', icon: Info },
        { to: '/contact', label: 'Contact', icon: Mail },
      ],
    },
  ]

  // Liens pour les Administrateurs
  const adminNavSections = [
    {
      title: 'GESTION ADMIN',
      links: [
        {
          to: '/admin/statistiques',
          label: 'Statistiques',
          icon: BarChart3,
          isExtraActive: (pathname) => pathname === '/admin' || pathname === '/admin/statistiques',
        },
        { to: '/admin/voyages', label: 'Gestion Voyages', icon: Plane },
        { to: '/admin/reservations', label: 'Réservations', icon: CalendarCheck },
        { to: '/admin/participants', label: 'Participants', icon: Users },
        { to: '/admin/transactions', label: 'Transactions', icon: Receipt },
      ],
    },
    {
      title: 'COMMUNICATION',
      links: [
        { to: '/admin/messages', label: 'Messagerie', icon: MessageSquare },
        { to: '/admin/avis', label: 'Avis Voyageurs', icon: Star },
      ],
    },
    {
      title: 'VUE SITE',
      links: [
        { to: '/', label: 'Site Public', icon: ExternalLink, end: true },
      ],
    },
  ]

  const activeSections = isAdmin ? adminNavSections : travelerNavSections

  return (
    <>
      {/* 1. Backdrop Overlay pour Mobile */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 2. Barre Latérale Gauche (Desktop w-64 & Mobile Slide-Over Drawer) */}
      <aside className={`unified-sidebar ${mobileOpen ? 'is-mobile-open' : ''}`}>
        {/* En-tête de la Sidebar : Logo & Marque */}
        <div className="sidebar-header">
          <Link
            to={isAdmin ? '/admin/statistiques' : '/'}
            className="sidebar-brand"
            onClick={onClose}
          >
            <span className="sidebar-brand-mark">✈</span>
            <div className="sidebar-brand-info">
              <span className="sidebar-brand-title">TravelPlan</span>
              {isAdmin && <span className="sidebar-brand-badge">ADMIN</span>}
            </div>
          </Link>

          {/* Bouton de fermeture mobile */}
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de navigation (au milieu, scrollable) */}
        <div className="sidebar-body">
          {activeSections.map((section, sIdx) => (
            <div key={section.title || sIdx} className="sidebar-section">
              {section.title && (
                <span className="sidebar-section-title">{section.title}</span>
              )}
              <nav className="sidebar-nav">
                {section.links.map((link) => {
                  const Icon = link.icon
                  const isCurrentActive = link.isExtraActive
                    ? link.isExtraActive(location.pathname)
                    : false

                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        `sidebar-nav-link ${isActive || isCurrentActive ? 'is-active' : ''}`
                      }
                      onClick={onClose}
                    >
                      <Icon className="sidebar-nav-icon" />
                      <span className="sidebar-nav-label">{link.label}</span>
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Pied de la Sidebar : Profil Utilisateur & Connexion/Déconnexion (Pinned at bottom) */}
        <div className="sidebar-footer">
          {currentUser ? (
            <div className="sidebar-user-block">
              <Link
                to="/profil"
                className="sidebar-user-card"
                onClick={onClose}
                title="Consulter mon profil"
              >
                <div className="sidebar-avatar">
                  {userInitials}
                </div>
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">{userName}</span>
                  <span className="sidebar-user-role">
                    {isAdmin ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Administrateur</span>
                      </>
                    ) : (
                      <>
                        <Ticket className="w-3.5 h-3.5 text-amber-400" />
                        <span>Voyageur</span>
                      </>
                    )}
                  </span>
                </div>
              </Link>

              <button
                type="button"
                className="sidebar-logout-btn"
                onClick={handleLogout}
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          ) : (
            <div className="sidebar-guest-block">
              <button
                type="button"
                className="btn btn-primary sidebar-auth-btn"
                onClick={() => {
                  onClose()
                  openLoginModal()
                }}
              >
                <LogIn className="w-4 h-4" />
                <span>Connexion</span>
              </button>

              <button
                type="button"
                className="btn btn-outline-light sidebar-auth-btn"
                onClick={() => {
                  onClose()
                  openRegisterModal()
                }}
              >
                <UserPlus className="w-4 h-4" />
                <span>Créer un compte</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
