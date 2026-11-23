import { useEffect, useState, useRef } from 'react'
import { api } from '../../api/client.js'
import Pagination from '../../components/Pagination.jsx'
import './AdminReviews.css'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  // Pagination (5 avis par page)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const listRef = useRef(null)

  async function load() {
    const res = await api.get('/admin/reviews')
    if (res.ok) setReviews(res.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function togglePublish(review) {
    const newStatus = !review.published
    const res = await api.put(`/admin/reviews/${review.id}/publish`, { published: newStatus })
    if (res.ok) {
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, published: newStatus } : r))
      )
    }
  }

  const totalItems = reviews.length
  const paginatedReviews = reviews.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="admin-page-content">
      <div className="admin-page-header">
        <span className="eyebrow">Modération</span>
        <h1>Avis & Témoignages Voyageurs</h1>
      </div>
      <p className="reviews-intro">
        Consultez les avis déposés par les voyageurs après la fin de leur séjour. Seuls les avis approuvés et publiés sont affichés sur la page d'accueil.
      </p>

      {loading ? (
        <p>Chargement des avis…</p>
      ) : reviews.length === 0 ? (
        <div className="empty-state ticket" style={{ padding: '40px', textAlign: 'center' }}>
          <p>Aucun avis voyageur soumis pour le moment.</p>
        </div>
      ) : (
        <>
          <div ref={listRef} className="reviews-list">
            {paginatedReviews.map((r) => (
              <div key={r.id} className="review-card ticket">
                <div className="review-card-top">
                  <div>
                    <strong>{r.user?.firstName} {r.user?.lastName}</strong>
                    <span className="review-card-trip">
                      Circuit : {r.trip?.title} {r.trip?.destination ? `(📍 ${r.trip.destination})` : ''}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="review-card-stars">
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '2px' }}>
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>

                <p className="review-card-comment">« {r.comment} »</p>

                <div className="review-card-footer">
                  <span className={`status-tag ${r.published ? 'status-confirmed' : 'status-attente'}`}>
                    {r.published ? "✓ Approuvé (En ligne sur l'accueil)" : '⏳ En attente de validation'}
                  </span>
                  <button
                    type="button"
                    className={r.published ? 'btn btn-outline' : 'btn btn-gold'}
                    onClick={() => togglePublish(r)}
                  >
                    {r.published ? "Retirer de l'accueil" : "✓ Approuver & Publier sur l'accueil"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="avis"
            tableRef={listRef}
          />
        </>
      )}
    </div>
  )
}