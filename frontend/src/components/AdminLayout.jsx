import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  BarChart3,
  Plane,
  Users,
  CalendarCheck,
  Receipt,
  MessageSquare,
  Star,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import ScrollToTop from './ScrollToTop.jsx'
import './AdminLayout.css'

const NAV_ITEMS = [
  { to: '/admin', label: 'Statistiques', icon: BarChart3, end: true },
  { to: '/admin/voyages', label: 'Voyages', icon: Plane },
  { to: '/admin/reservations', label: 'Réservations', icon: CalendarCheck },
  { to: '/admin/participants', label: 'Participants', icon: Users },
  { to: '/admin/transactions', label: 'Transactions', icon: Receipt },
  { to: '/admin/messages', label: 'Messagerie', icon: MessageSquare },
  { to: '/admin/avis', label: 'Avis Voyageurs', icon: Star },
]

export default function AdminLayout({ title, eyebrow, children }) {
  const { currentUser, logout } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  // État du menu tiroir mobile (slide-over)
  const [mobileOpen, setMobileOpen] = useState(false)
  // État de réduction de la sidebar desktop (collapsible)
  const [collapsed, setCollapsed] = useState(false)

  // Fermer le menu mobile lors d'un changement de route
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Fermer le menu mobile avec la touche Échap (Escape)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  // Empêcher le scroll du body quand le tiroir mobile est ouvert
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
    navigate('/')
  }

  // Obtenir les initiales de l'administrateur
  const adminName = currentUser
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Admin'
    : 'Admin'
  const initials = currentUser
    ? `${currentUser.firstName?.[0] || 'A'}${currentUser.lastName?.[0] || 'D'}`.toUpperCase()
    : 'AD'

  // Trouver le titre de la section courante
  const currentNav =
    NAV_ITEMS.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
    ) || (location.pathname.startsWith('/admin/paiements') ? { label: 'Réservations & Transactions' } : null)

  // Si le composant est utilisé avec des enfants comme conteneur de page (rétrocompatibilité)
  if (children || title || eyebrow) {
    return (
      <div className="admin-page-content">
        {(eyebrow || title) && (
          <div className="admin-page-header">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h1>{title}</h1>}
          </div>
        )}
        {children}
      </div>
    )
  }

  return (
    <div className={`admin-workspace ${collapsed ? 'is-collapsed' : ''}`}>
      <ScrollToTop />

      {/* ========================================================
          1. BACKDROP OVERLAY POUR MOBILE (Slide-over Drawer)
          ======================================================== */}
      {mobileOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ========================================================
          2. SIDEBAR ADMIN (Desktop Collapsible & Mobile Slide-Over)
          ======================================================== */}
      <aside className={`admin-workspace-sidebar ${mobileOpen ? 'is-mobile-open' : ''}`}>
        {/* En-tête de la Sidebar */}
        <div className="sidebar-brand-header">
          <Link to="/admin" className="sidebar-brand">
            <span className="sidebar-brand-icon">✈</span>
            {!collapsed && (
              <div className="sidebar-brand-text">
                <span className="brand-name">TravelPlan</span>
                <span className="brand-badge">ADMIN</span>
              </div>
            )}
          </Link>

          {/* Bouton fermeture sur mobile */}
          <button
            type="button"
            className="mobile-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation */}
        <div className="sidebar-nav-section">
          {!collapsed && <span className="sidebar-section-title">ESPACE GESTION</span>}
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'is-active' : ''} ${collapsed ? 'is-icon-only' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="sidebar-link-icon" />
                  {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Pied de la Sidebar */}
        <div className="sidebar-footer">
          {/* Lien rapide vers le site public */}
          <Link
            to="/"
            className={`sidebar-public-link ${collapsed ? 'is-icon-only' : ''}`}
            title="Consulter le site public voyageur"
          >
            <ExternalLink className="sidebar-link-icon" />
            {!collapsed && <span>Voir le site public</span>}
          </Link>

          {/* Bouton de réduction de la sidebar desktop */}
          <button
            type="button"
            className="sidebar-collapse-btn hidden lg:flex"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Réduire</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================
          3. ZONE PRINCIPALE DE L'ESPACE ADMIN (TOP BAR + OUTLET)
          ======================================================== */}
      <div className="admin-main-wrapper">
        {/* TOP BAR COMPACTE */}
        <header className="admin-topbar">
          <div className="topbar-left">
            {/* Bouton Hamburger sur Mobile/Tablette */}
            <button
              type="button"
              className="topbar-menu-btn lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Fil d'ariane & Indicateur de section */}
            <div className="topbar-breadcrumb">
              <span className="breadcrumb-root">Admin</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">
                {currentNav?.label || 'Tableau de bord'}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Raccourci vers le site public */}
            <Link to="/" className="topbar-view-site-btn">
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voir le site</span>
            </Link>

            {/* Profil Administrateur */}
            <div className="topbar-admin-profile">
              <div className="admin-avatar" title={adminName}>
                {initials}
              </div>
              <div className="admin-profile-info hidden md:flex">
                <span className="admin-profile-name">{adminName}</span>
                <span className="admin-profile-role">
                  <ShieldCheck className="w-3 h-3 text-amber-500" />
                  Administrateur
                </span>
              </div>
            </div>

            {/* Bouton Déconnexion */}
            <button
              type="button"
              className="topbar-logout-btn"
              onClick={handleLogout}
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* CORPS DE CONTENU ADMIN (RENDU PAR REACT-ROUTER OUTLET) */}
        <main className="admin-workspace-content">
          <div className="admin-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
