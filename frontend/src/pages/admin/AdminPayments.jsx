import { useEffect, useState, useRef } from 'react'
import { api } from '../../api/client.js'
import AdminLayout from '../../components/AdminLayout.jsx'
import Pagination from '../../components/Pagination.jsx'
import './AdminPayments.css'

const statusClass = {
  'Confirmée': 'status-confirmed',
  'En attente': 'status-attente',
  'Annulée': 'status-annulee',
}

export default function AdminPayments() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  // Pagination (5 éléments par page)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const tableRef = useRef(null)

  useEffect(() => {
    async function load() {
      const res = await api.get('/admin/reservations')
      if (res.ok) setRows(res.data)
      setLoading(false)
    }
    load()
  }, [])

  const totalItems = rows.length
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <AdminLayout eyebrow="Suivi" title="Réservations & transactions">
      {loading ? (
        <p>Chargement…</p>
      ) : rows.length === 0 ? (
        <div className="empty-state">
          <p>Aucune réservation pour le moment.</p>
        </div>
      ) : (
        <>
          <div ref={tableRef} className="payments-table ticket">
            <div className="payments-row payments-header">
              <span>Voyageur</span>
              <span>Circuit & Destination</span>
              <span>Voyageurs</span>
              <span>Montant</span>
              <span>Confirmation</span>
              <span>Statut</span>
            </div>
            {paginatedRows.map((r) => (
              <div className="payments-row" key={r.id}>
                <span>{r.user.firstName} {r.user.lastName}</span>
                <span>
                  <strong>{r.trip.title}</strong>
                  <small style={{ display: 'block', color: 'var(--ink-soft)' }}>📍 {r.trip.destination}</small>
                </span>
                <span>{r.quantity} voyageur{r.quantity > 1 ? 's' : ''}</span>
                <strong style={{ color: '#d4af37' }}>{r.amount} DT</strong>
                <span className="status-tag status-confirmed">
                  📧 Email envoyé
                </span>
                <span className={`status-tag ${statusClass[r.status] || 'status-confirmed'}`}>{r.status}</span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="réservations"
            tableRef={tableRef}
          />
        </>
      )}
    </AdminLayout>
  )
}