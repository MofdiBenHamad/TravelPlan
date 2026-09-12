import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import AdminLayout from '../../components/AdminLayout.jsx'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      const res = await api.get('/admin/stats')
      if (res.ok) setStats(res.data)
    }
    load()
  }, [])

  const cards = stats
    ? [
        { label: 'Voyages', value: stats.tripsCount, to: '/admin/voyages' },
        { label: 'Réservations', value: stats.reservationsCount, to: '/admin/paiements' },
        { label: 'Voyageurs', value: stats.travelersCount, to: '/admin/participants' },
        { label: 'Places disponibles', value: stats.availablePlaces, to: '/admin/voyages' },
        { label: 'Revenus générés', value: `${stats.revenue} DT`, to: '/admin/paiements' },
      ]
    : []

  return (
    <AdminLayout eyebrow="Vue d'ensemble" title="Dashboard">
      {!stats ? (
        <p>Chargement…</p>
      ) : (
        <div className="dash-grid">
          {cards.map((s) => (
            <Link to={s.to} key={s.label} className="dash-stat ticket">
              <span className="dash-stat-label">{s.label}</span>
              <strong className="dash-stat-value">{s.value}</strong>
            </Link>
          ))}
        </div>
      )}

      <div className="perforation" />

      <div className="dash-shortcuts">
        <Link to="/admin/voyages" className="dash-shortcut">
          <strong>Gestion des voyages</strong>
          <span>Ajouter, modifier ou supprimer une offre</span>
        </Link>
        <Link to="/admin/participants" className="dash-shortcut">
          <strong>Liste des participants</strong>
          <span>Voir les voyageurs inscrits par voyage</span>
        </Link>
        <Link to="/admin/paiements" className="dash-shortcut">
          <strong>Réservations & transactions</strong>
          <span>Suivre les réservations et transactions par email</span>
        </Link>
        <Link to="/admin/messages" className="dash-shortcut">
          <strong>Messagerie</strong>
          <span>Lire les messages envoyés depuis Contact</span>
        </Link>
        <Link to="/admin/avis" className="dash-shortcut">
          <strong>Avis voyageurs</strong>
          <span>Valider les avis à afficher sur l'accueil</span>
        </Link>
      </div>
    </AdminLayout>
  )
}