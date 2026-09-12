import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/client.js'
import ReviewForm from './ReviewForm.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import './MyReservations.css'

export default function MyReservations() {
  const { cancelReservation } = useApp()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [openReviewId, setOpenReviewId] = useState(null)
  const [reservationToCancel, setReservationToCancel] = useState(null)
  const [isCanceling, setIsCanceling] = useState(false)

  async function load() {
    const res = await api.get('/reservations/me')
    if (res.ok) setReservations(res.data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function handlePromptCancel(reservation) {
    setReservationToCancel(reservation)
  }

  async function handleConfirmCancel() {
    if (!reservationToCancel) return
    setIsCanceling(true)
    await cancelReservation(reservationToCancel.id)
    setIsCanceling(false)
    setReservationToCancel(null)
    load()
  }

  if (loading) return null

  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">Mon espace voyageur</span>
        <h1>Mes réservations</h1>

        {reservations.length === 0 ? (
          <div className="empty-state">
            <p>Vous n'avez pas encore de réservation enregistrée.</p>
            <Link to="/voyages" className="btn btn-primary">Découvrir nos circuits</Link>
          </div>
        ) : (
          <div className="my-res-list">
            {reservations.map((r) => {
              const destName = r.trip?.destination?.name || r.trip?.destinationName || 'Destination'
              const totalAmount = (r.trip?.price || 0) * r.quantity
              const isTripCompleted = new Date() >= new Date(r.trip.returnDate)
              const hasReview = Boolean(r.review)
              const isCanceled = r.status === 'Annulée'
              const returnDateFormatted = new Date(r.trip.returnDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })

              return (
                <div key={r.id} className="my-res-card ticket">
                  <img src={r.trip.image} alt={r.trip.title} className="my-res-image" />
                  <div className="my-res-body">
                    <div className="my-res-top">
                      <div>
                        <h3>{r.trip.title}</h3>
                        <span className="my-res-dest">📍 {destName}</span>
                      </div>
                      <strong>{totalAmount} DT</strong>
                    </div>

                    <div className="my-res-dates">
                      {new Date(r.trip.departureDate).toLocaleDateString('fr-FR')} →{' '}
                      {new Date(r.trip.returnDate).toLocaleDateString('fr-FR')}
                      {isTripCompleted && !isCanceled && (
                        <span className="trip-completed-badge"> · Séjour terminé</span>
                      )}
                    </div>

                    <div className="my-res-offer">
                      {r.quantity} voyageur{r.quantity > 1 ? 's' : ''} · {r.trip.price} DT / personne
                    </div>

                    <div className="my-res-tags">
                      <span className={`status-tag ${r.status === 'Confirmée' ? 'status-confirmed' : isCanceled ? 'status-annulee' : 'status-attente'}`}>
                        {r.status === 'Confirmée'
                          ? '✓ Réservation : Confirmée'
                          : isCanceled
                          ? (r.trip?.status === 'Annulé' ? '✕ Réservation : Annulée (Circuit annulé par l\'agence)' : '✕ Réservation : Annulée')
                          : '⏳ En attente de confirmation email'}
                      </span>
                      {hasReview && (
                        <span className="status-tag status-review-badge">
                          ⭐ Avis déposé ({'★'.repeat(r.review.rating)})
                        </span>
                      )}
                    </div>

                    {isCanceled && r.trip?.status === 'Annulé' && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', fontSize: '0.86rem', color: '#991b1b', margin: '8px 0' }}>
                        ℹ️ <strong>Information agence :</strong> Ce circuit a été annulé.
                      </div>
                    )}

                    <div className="my-res-actions">
                      <Link to={`/voyages/${r.trip.id}`} className="btn btn-outline">
                        Voir le circuit
                      </Link>

                      {/* Bouton Donner un avis (actif seulement si le séjour est terminé) */}
                      {hasReview ? (
                        <button type="button" className="btn btn-outline" disabled style={{ opacity: 0.8, cursor: 'default' }}>
                          ✓ Avis déjà envoyé ({'★'.repeat(r.review.rating)})
                        </button>
                      ) : isCanceled ? null : isTripCompleted ? (
                        <button
                          type="button"
                          className="btn btn-gold"
                          onClick={() => setOpenReviewId(openReviewId === r.id ? null : r.id)}
                        >
                          {openReviewId === r.id ? 'Fermer le formulaire' : '⭐ Donner un avis'}
                        </button>
                      ) : (
                        <div
                          className="disabled-review-wrapper"
                          title={`Disponible après la fin du voyage (le ${returnDateFormatted})`}
                        >
                          <button
                            type="button"
                            className="btn btn-outline disabled-review-btn"
                            disabled
                            aria-disabled="true"
                          >
                            Donner un avis
                          </button>
                          <div className="disabled-review-tooltip" role="tooltip">
                            ⏳ Disponible dès la fin de votre séjour (le {returnDateFormatted}).
                          </div>
                        </div>
                      )}

                      {/* Bouton Payer désactivé avec infobulle au survol */}
                      <div
                        className="disabled-pay-wrapper"
                        title="Paiement actuellement indisponible — instructions envoyées par email"
                      >
                        <button
                          type="button"
                          className="btn btn-primary disabled-pay-btn"
                          disabled
                          aria-disabled="true"
                        >
                          Payer
                        </button>
                        <div className="disabled-pay-tooltip" role="tooltip">
                          ⚠️ Actuellement indisponible .
                        </div>
                      </div>

                      {!isCanceled && !isTripCompleted && (
                        <button className="btn btn-danger" onClick={() => handlePromptCancel(r)}>
                          Annuler
                        </button>
                      )}
                    </div>

                    {openReviewId === r.id && !hasReview && isTripCompleted && (
                      <div className="my-res-review">
                        <ReviewForm
                          reservationId={r.id}
                          tripTitle={r.trip.title}
                          onSubmitted={() => {
                            setOpenReviewId(null)
                            load()
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal de Confirmation d'Annulation de Réservation */}
        <ConfirmModal
          isOpen={Boolean(reservationToCancel)}
          title="Annuler la réservation ?"
          itemTitle={reservationToCancel ? `${reservationToCancel.trip?.title}` : ''}
          message="Êtes-vous sûr de vouloir annuler cette réservation ?"
          confirmText="Confirmer"
          cancelText="Annuler"
          isDanger={true}
          loading={isCanceling}
          onConfirm={handleConfirmCancel}
          onClose={() => !isCanceling && setReservationToCancel(null)}
        />
      </div>
    </section>
  )
}