import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
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

  const location = useLocation()
  const isReservations = location.pathname.includes('reservations')
  const isTransactions = location.pathname.includes('transactions')

  const title = isReservations
    ? 'Réservations'
    : isTransactions
    ? 'Transactions'
    : 'Réservations & transactions'

  const eyebrow = isReservations
    ? 'Réservations des voyageurs'
    : isTransactions
    ? 'Paiements & transactions'
    : 'Suivi'

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
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
    </div>
  )
}