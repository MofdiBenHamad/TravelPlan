import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/client.js'
import './Profile.css'

export default function Profile() {
  const { currentUser, updateProfile, logout } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    email: currentUser.email,
  })
  const [saved, setSaved] = useState(false)
  const [reservationsCount, setReservationsCount] = useState(0)

  useEffect(() => {
    async function loadCount() {
      const res = await api.get('/reservations/me')
      if (res.ok) {
        setReservationsCount(res.data.filter((r) => r.status !== 'Annulée').length)
      }
    }
    loadCount()
  }, [])

  function handleChange(e) {
    setSaved(false)
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const result = await updateProfile(form)
    if (result.ok) setSaved(true)
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <section className="section">
      <div className="container profile-layout">
        <div className="profile-card ticket">
          <div className="profile-avatar">
            {currentUser.firstName[0]}
            {currentUser.lastName[0]}
          </div>
          <h2>{currentUser.firstName} {currentUser.lastName}</h2>
          <span className="status-tag status-confirmed">{currentUser.role}</span>
          <div className="perforation" />
          <div className="profile-stat">
            <span>Réservations actives</span>
            <strong>{reservationsCount}</strong>
          </div>
          <button className="btn btn-outline btn-block" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>

        <form className="profile-form ticket" onSubmit={handleSubmit}>
          <span className="eyebrow">Modifier le profil</span>
          <h1>Mes informations</h1>

          <div className="field">
            <label htmlFor="firstName">Prénom</label>
            <input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="lastName">Nom</label>
            <input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
          </div>

          {saved && <p className="profile-saved">Profil mis à jour avec succès.</p>}

          <button type="submit" className="btn btn-primary">
            Enregistrer les modifications
          </button>
        </form>
      </div>
    </section>
  )
}