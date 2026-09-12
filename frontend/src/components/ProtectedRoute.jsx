import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

// role: 'ADMIN' | 'VOYAGEUR' | undefined (tout utilisateur authentifié)
export default function ProtectedRoute({ children, role }) {
  const { currentUser, loading, openLoginModal } = useApp()

  useEffect(() => {
    if (!loading && !currentUser) {
      openLoginModal()
    }
  }, [loading, currentUser, openLoginModal])

  if (loading) return null

  if (!currentUser) {
    return <Navigate to="/" replace />
  }
  if (role && currentUser.role !== role) {
    return <Navigate to="/" replace />
  }
  return children
}