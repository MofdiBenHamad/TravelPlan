import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

/**
 * AdminProtectedRoute / AdminRoute
 * Protège l'accès à toutes les routes /admin/*
 * - Seuls les utilisateurs avec le rôle 'ADMIN' sont autorisés.
 * - Les utilisateurs non connectés sont redirigés vers / avec ouverture de la boîte de connexion.
 * - Les voyageurs réguliers (VOYAGEUR) sont automatiquement redirigés vers l'accueil /.
 */
export function AdminRoute({ children }) {
  const { currentUser, loading, openLoginModal } = useApp()

  useEffect(() => {
    if (!loading && !currentUser) {
      openLoginModal()
    }
  }, [loading, currentUser, openLoginModal])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-400 font-mono">Vérification des accès Administrateur…</p>
      </div>
    )
  }

  // Non authentifié -> redirection accueil
  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  // Connecté mais non ADMIN (ex: VOYAGEUR) -> redirection accueil
  if (currentUser.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return children ? children : <Outlet />
}

export const AdminProtectedRoute = AdminRoute
export default AdminRoute
