import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../api/client.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [destinations, setDestinations] = useState([])
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' })
  
  const openLoginModal = useCallback(() => setAuthModal({ isOpen: true, mode: 'login' }), [])
  const openRegisterModal = useCallback(() => setAuthModal({ isOpen: true, mode: 'register' }), [])
  const closeAuthModal = useCallback(() => setAuthModal((prev) => ({ ...prev, isOpen: false })), [])
  const setAuthModalMode = useCallback((mode) => setAuthModal((prev) => ({ ...prev, mode })), [])

  const refreshTrips = useCallback(async () => {
    const res = await api.get('/trips')
    if (res.ok) setTrips(res.data)
    return res
  }, [])

  const refreshDestinations = useCallback(async () => {
    const res = await api.get('/destinations')
    if (res.ok) setDestinations(res.data)
    return res
  }, [])

  useEffect(() => {
    async function init() {
      await Promise.all([refreshTrips(), refreshDestinations()])
      if (getToken()) {
        const res = await api.get('/auth/me')
        if (res.ok) setCurrentUser(res.data.user)
        else setToken(null)
      }
      setLoading(false)
    }
    init()
  }, [refreshTrips, refreshDestinations])

  // ---- Auth ----
  async function register(form) {
    const res = await api.post('/auth/register', form)
    if (!res.ok) return { ok: false, error: res.error }
    setToken(res.data.token)
    setCurrentUser(res.data.user)
    return { ok: true, user: res.data.user }
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    if (!res.ok) return { ok: false, error: res.error }
    setToken(res.data.token)
    setCurrentUser(res.data.user)
    return { ok: true, user: res.data.user }
  }

  function logout() {
    setToken(null)
    setCurrentUser(null)
  }

  async function updateProfile(updates) {
    const res = await api.put('/users/me', updates)
    if (!res.ok) return { ok: false, error: res.error }
    setCurrentUser(res.data.user)
    return { ok: true }
  }

  // ---- Destinations (Admin) ----
  async function addDestination(destination) {
    const res = await api.post('/destinations', destination)
    if (res.ok) await Promise.all([refreshDestinations(), refreshTrips()])
    return res
  }

  async function updateDestination(id, updates) {
    const res = await api.put(`/destinations/${id}`, updates)
    if (res.ok) await Promise.all([refreshDestinations(), refreshTrips()])
    return res
  }

  async function deleteDestination(id) {
    const res = await api.del(`/destinations/${id}`)
    if (res.ok) await Promise.all([refreshDestinations(), refreshTrips()])
    return res
  }

  // ---- Trips (Admin) ----
  async function addTrip(trip) {
    const res = await api.post('/trips', trip)
    if (res.ok) await Promise.all([refreshTrips(), refreshDestinations()])
    return res
  }

  async function updateTrip(id, updates) {
    const res = await api.put(`/trips/${id}`, updates)
    if (res.ok) await Promise.all([refreshTrips(), refreshDestinations()])
    return res
  }

  async function deleteTrip(id) {
    const res = await api.del(`/trips/${id}`)
    if (res.ok) await Promise.all([refreshTrips(), refreshDestinations()])
    return res
  }

  // ---- Reservations ----
  async function createReservation(tripId, quantity) {
    const res = await api.post('/reservations', { tripId, quantity })
    if (res.ok) await Promise.all([refreshTrips(), refreshDestinations()])
    return res
  }

  async function payReservation() {
    return {
      ok: false,
      error: 'Le paiement en ligne est actuellement indisponible. Un email contenant les instructions de transaction vous a été envoyé.',
    }
  }

  async function cancelReservation(reservationId) {
    const res = await api.put(`/reservations/${reservationId}/cancel`)
    if (res.ok) await Promise.all([refreshTrips(), refreshDestinations()])
    return res
  }

  const value = {
    currentUser,
    destinations,
    trips,
    loading,
    register,
    login,
    logout,
    updateProfile,
    addDestination,
    updateDestination,
    deleteDestination,
    addTrip,
    updateTrip,
    deleteTrip,
    createReservation,
    payReservation,
    cancelReservation,
    refreshTrips,
    refreshDestinations,
    authModal,
    isLoginModalOpen: authModal.isOpen,
    authModalMode: authModal.mode,
    openLoginModal,
    openRegisterModal,
    closeAuthModal,
    closeLoginModal: closeAuthModal,
    setAuthModalMode,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp doit être utilisé à l'intérieur de AppProvider")
  return ctx
}