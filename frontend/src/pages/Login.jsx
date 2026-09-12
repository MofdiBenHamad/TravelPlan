import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function Login() {
  const { openLoginModal, currentUser } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'ADMIN' ? '/admin' : '/', { replace: true })
    } else {
      openLoginModal()
      const fallback = location.state?.from || '/'
      navigate(fallback, { replace: true })
    }
  }, [currentUser, openLoginModal, navigate, location])

  return null
}