import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Composant ScrollToTop
 * Fait défiler automatiquement la page au sommet lors de chaque navigation ou changement de route.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }

    // Scroll instantané tout en haut de la fenêtre
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [pathname, search, hash])

  return null
}

/**
 * Hook personnalisé réutilisable useScrollToTop
 */
export function useScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      })
    }
  }, [pathname, search, hash])
}
