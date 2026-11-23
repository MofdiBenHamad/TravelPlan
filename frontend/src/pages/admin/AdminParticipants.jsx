import { useEffect, useState, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { api } from '../../api/client.js'
import Pagination from '../../components/Pagination.jsx'
import './AdminParticipants.css'

export default function AdminParticipants() {
  const { trips } = useApp()
  const [selectedTripId, setSelectedTripId] = useState('all')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  // Pagination (5 éléments par page)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const tableRef = useRef(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const query = selectedTripId === 'all' ? '' : `?tripId=${selectedTripId}`
      const res = await api.get(`/admin/participants${query}`)
      if (res.ok) setRows(res.data)
      setLoading(false)
    }
    load()
    // Réinitialise la page à 1 lors d'un changement de filtre
    setCurrentPage(1)
  }, [selectedTripId])

  const totalItems = rows.length
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <span className="eyebrow">Suivi</span>
        <h1>Participants</h1>
      </div>
      <div className="participants-filter">
        <label htmlFor="trip-filter">Filtrer par circuit / voyage</label>
        <select id="trip-filter" value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)}>
          <option value="all">Tous les circuits ({trips.length})</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.destination?.name || t.destinationName})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Chargement…</p>
      ) : rows.length === 0 ? (
        <div className="empty-state">
          <p>Aucun participant pour cette sélection.</p>
        </div>
      ) : (
        <>
          <div ref={tableRef} className="participants-table ticket">
            <div className="participants-row participants-header">
              <span>Nom</span>
              <span>Email</span>
              <span>Circuit & Destination</span>
              <span>Voyageurs</span>
              <span>Statut</span>
            </div>
            {paginatedRows.map((r) => (
              <div className="participants-row" key={r.id}>
                <span>{r.user.firstName} {r.user.lastName}</span>
                <span>{r.user.email}</span>
                <span>
                  <strong>{r.trip.title}</strong>
                  <small style={{ display: 'block', color: 'var(--ink-soft)' }}>{r.trip.destination}</small>
                </span>
                <span>{r.quantity} pers. ({r.amount} DT)</span>
                <span className="status-tag status-confirmed">
                  {r.status}
                </span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="participants"
            tableRef={tableRef}
          />
        </>
      )}
    </div>
  )
}