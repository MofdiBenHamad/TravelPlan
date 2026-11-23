import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import AdminAnalytics from '../../components/admin/AdminAnalytics.jsx'
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

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <span className="eyebrow">Vue d'ensemble</span>
        <h1>Tableau de Bord & Analytics</h1>
      </div>

      {/* SECTION ANALYTICS & STATISTIQUES (KPIs, Courbes, Donut, Barres) */}
      <AdminAnalytics />

      <div className="perforation" />

      {/* Raccourcis Rapides de Gestion */}
      <div className="dash-shortcuts-header mb-3">
        <h3 className="text-lg font-bold text-slate-800 m-0">Raccourcis & Modules d'Administration</h3>
        <p className="text-xs text-slate-400 mt-0.5 m-0">Accédez directement aux modules de gestion de l'application.</p>
      </div>

      <div className="dash-shortcuts">
        <Link to="/admin/voyages" className="dash-shortcut">
          <strong>Gestion des voyages</strong>
          <span>Ajouter, modifier ou supprimer une offre</span>
        </Link>
        <Link to="/admin/participants" className="dash-shortcut">
          <strong>Liste des participants</strong>
          <span>Voir les voyageurs inscrits par voyage</span>
        </Link>
        <Link to="/admin/reservations" className="dash-shortcut">
          <strong>Réservations</strong>
          <span>Suivre et gérer les réservations de circuits</span>
        </Link>
        <Link to="/admin/transactions" className="dash-shortcut">
          <strong>Transactions</strong>
          <span>Suivre les paiements et montants reçus</span>
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
    </div>
  )
}
