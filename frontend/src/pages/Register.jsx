import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function Register() {
  const { openRegisterModal, currentUser } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true })
    } else {
      openRegisterModal()
      navigate('/', { replace: true })
    }
  }, [currentUser, openRegisterModal, navigate])

  return null
}