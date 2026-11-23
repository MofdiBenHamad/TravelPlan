import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import MobileHeader from '../components/MobileHeader.jsx'
import Footer from '../components/Footer.jsx'
import LoginModal from '../components/LoginModal.jsx'
import ScrollToTop from '../components/ScrollToTop.jsx'
import './MainLayout.css'

/**
 * MainLayout
 * Layout unifié partagé par les Voyageurs et les Administrateurs.
 * Remplace la barre supérieure horizontale par une Sidebar gauche épurée (w-64 sur desktop)
 * associée à une zone de contenu scrollable à droite.
 * Sur mobile/tablette (< 1024px), la barre latérale se replie en tiroir coulissant.
 */
export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Fermer le tiroir mobile lors d'un changement de route
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="unified-layout-root">
      <ScrollToTop />
      <LoginModal />

      {/* 1. Barre Latérale Gauche Unifiée (Desktop w-64 & Tiroir Mobile) */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* 2. Zone Principale Scrollable à Droite */}
      <div className="unified-main-area">
        {/* En-tête mobile compact (< 1024px) */}
        <MobileHeader onToggleMenu={() => setMobileOpen((o) => !o)} />

        {/* Corps de la page */}
        <main className="unified-page-content flex-1">
          <Outlet />
        </main>

        {/* Pied de page du site */}
        <Footer />
      </div>
    </div>
  )
}
