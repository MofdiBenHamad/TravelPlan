import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/client.js'
import ReviewForm from './ReviewForm.jsx'
import './Payment.css'

export default function Payment() {
  const { reservationId } = useParams()
  const { currentUser } = useApp()

  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [reviewed, setReviewed] = useState(false)

  useEffect(() => {
    let ignore = false
    async function load() {
      const res = await api.get(`/reservations/${reservationId}`)
      if (ignore) return
      if (!res.ok) {
        setNotFound(true)
      } else {
        setReservation(res.data)
        if (res.data.review) setReviewed(true)
      }
      setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [reservationId])

  if (loading) return null

  if (notFound || !reservation || (currentUser && reservation.userId !== currentUser.id && currentUser.role !== 'ADMIN')) {
    return (
      <section className="section">
        <div className="container empty-state">
          <p>Réservation introuvable.</p>
          <Link to="/voyages" className="btn btn-outline">Retour aux voyages</Link>
        </div>
      </section>
    )
  }

  const trip = reservation.trip
  const destName = trip?.destination?.name || trip?.destinationName || 'Destination'
  const total = (trip?.price || 0) * (reservation.quantity || 1)
  const refCode = reservation.id ? reservation.id.slice(-8).toUpperCase() : ''

  if (reservation.status === 'Annulée') {
    return (
      <section className="section">
        <div className="container empty-state">
          <p>Cette réservation a été annulée.</p>
          <Link to="/mes-reservations" className="btn btn-outline">Mes réservations</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container pay-layout">
        <div className="pay-form ticket">
          <span className="eyebrow">Transaction & Règlement</span>
          <h1>Détails de la transaction</h1>

          <div className="pay-unavailable-banner">
            <span className="pay-unavailable-icon">ℹ️</span>
            <div>
              <strong>Paiement en ligne actuellement indisponible</strong>
              <p>
                Le module de paiement par carte est désactivé. Un email de confirmation avec les
                instructions détaillées pour finaliser votre transaction a été envoyé directement à :
                <br />
                <span className="recipient-email">{currentUser?.email}</span>
              </p>
            </div>
          </div>

          <div className="pay-instructions-box">
            <h3>Modes de finalisation disponibles sous 48h :</h3>
            <ul>
              <li><strong>En agence :</strong> Présentez votre référence <strong>#{refCode}</strong> (espèces, chèque, TPE).</li>
              <li><strong>Par virement bancaire :</strong> Montant de <strong>{total} DT</strong> vers <code>RIB: 08 000 0001234567890 12</code> avec réf. <strong>#{refCode}</strong>.</li>
              <li><strong>Téléphone :</strong> Contactez le (+216) 71 000 000 pour toute question.</li>
            </ul>
          </div>

          <div className="field">
            <label htmlFor="cardName">Nom sur la carte (option désactivée)</label>
            <input id="cardName" name="cardName" value={`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`} disabled readOnly />
          </div>
          <div className="field">
            <label htmlFor="cardNumber">Numéro de carte</label>
            <input id="cardNumber" name="cardNumber" value="•••• •••• •••• ••••" disabled readOnly />
          </div>

          {/* Bouton Payer désactivé avec infobulle au survol */}
          <div className="disabled-pay-wrapper" title="Paiement actuellement indisponible — instructions envoyées par email">
            <button
              type="button"
              className="btn btn-primary btn-block disabled-pay-btn"
              disabled
              aria-disabled="true"
            >
              Payer {total} DT
            </button>
            <div className="disabled-pay-tooltip" role="tooltip">
              ⚠️ Actuellement indisponible — Les transactions sont finalisées par les instructions envoyées par email.
            </div>
          </div>

          <div className="pay-alt-links">
            <Link to="/mes-reservations" className="btn btn-outline btn-block">
              Voir mes réservations
            </Link>
          </div>
        </div>

        <aside className="pay-summary ticket">
          <span className="eyebrow">Récapitulatif</span>
          <h2>{trip.title}</h2>
          <div className="reserve-row">
            <span>Référence</span>
            <strong>#{refCode}</strong>
          </div>
          <div className="reserve-row">
            <span>Destination</span>
            <strong>{destName}</strong>
          </div>
          <div className="reserve-row">
            <span>Voyageur</span>
            <strong>{currentUser?.firstName} {currentUser?.lastName}</strong>
          </div>
          <div className="reserve-row">
            <span>Statut réservation</span>
            <strong style={{ color: '#059669' }}>{reservation.status}</strong>
          </div>
          <div className="perforation" />
          <div className="reserve-row reserve-total">
            <span>Montant total</span>
            <strong>{total} DT</strong>
          </div>
          <div className="reserve-row">
            <span>Tarif unitaire</span>
            <strong>{trip.price} DT / pers.</strong>
          </div>
          <div className="reserve-row">
            <span>Nombre de voyageurs</span>
            <strong>{reservation.quantity}</strong>
          </div>

          {!reviewed && reservation.status === 'Confirmée' && (
            <div style={{ marginTop: '24px' }}>
              <ReviewForm
                reservationId={reservation.id}
                tripTitle={trip.title}
                onSubmitted={() => setReviewed(true)}
              />
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}