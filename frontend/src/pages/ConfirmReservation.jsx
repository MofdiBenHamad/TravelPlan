import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api } from '../api/client.js'
import './ConfirmReservation.css'

export default function ConfirmReservation() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reservation, setReservation] = useState(null)
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false)

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError('Aucun jeton de confirmation fourni dans le lien.')
        setLoading(false)
        return
      }

      const res = await api.get(`/reservations/verify?token=${encodeURIComponent(token)}`)
      setLoading(false)

      if (!res.ok) {
        setError(res.error || 'Impossible de valider cette réservation.')
        return
      }

      setReservation(res.data.reservation)
      setAlreadyConfirmed(Boolean(res.data.alreadyConfirmed))
    }

    verify()
  }, [token])

  if (loading) {
    return (
      <section className="section">
        <div className="container confirm-page-container">
          <div className="confirm-card ticket">
            <div className="confirm-spinner">✈</div>
            <h2>Validation de votre réservation en cours…</h2>
            <p>Veuillez patienter pendant la confirmation officielle de votre dossier.</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section">
        <div className="container confirm-page-container">
          <div className="confirm-card ticket confirm-error-card">
            <div className="confirm-error-icon">⚠️</div>
            <span className="eyebrow">Échec de la confirmation</span>
            <h1>Lien invalide ou expiré</h1>
            <p className="confirm-error-msg">{error}</p>
            <div className="confirm-actions">
              <Link to="/mes-reservations" className="btn btn-primary">
                Consulter mes réservations
              </Link>
              <Link to="/contact" className="btn btn-outline">
                Contacter le support TravelPlan
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const trip = reservation?.trip
  const destName = trip?.destination?.name || trip?.destinationName || 'Destination internationale'
  const refCode = reservation?.id ? reservation.id.slice(-8).toUpperCase() : ''
  const total = (trip?.price || 0) * (reservation?.quantity || 1)

  return (
    <section className="section">
      <div className="container confirm-page-container">
        <div className="confirm-card ticket confirm-success-card">
          <div className="confirm-badge-icon">✓</div>
          <span className="eyebrow">
            {alreadyConfirmed ? 'Réservation déjà confirmée' : 'Confirmation réussie'}
          </span>
          <h1>
            {alreadyConfirmed
              ? 'Votre réservation est déjà confirmée !'
              : 'Félicitations, votre réservation est validée !'}
          </h1>
          <p className="confirm-subtitle">
            Votre place pour le circuit <strong>« {trip?.title} »</strong> est officiellement bloquée et confirmée.
          </p>

          <div className="confirm-summary ticket">
            <div className="confirm-row">
              <span>Référence Dossier</span>
              <strong>#{refCode}</strong>
            </div>
            <div className="confirm-row">
              <span>Statut Officiel</span>
              <strong style={{ color: '#059669' }}>✓ Confirmée</strong>
            </div>
            <div className="confirm-row">
              <span>Destination</span>
              <strong>📍 {destName}</strong>
            </div>
            <div className="confirm-row">
              <span>Circuit</span>
              <strong>{trip?.title}</strong>
            </div>
            {trip?.departureDate && (
              <div className="confirm-row">
                <span>Dates du séjour</span>
                <strong>
                  {new Date(trip.departureDate).toLocaleDateString('fr-FR')} →{' '}
                  {new Date(trip.returnDate).toLocaleDateString('fr-FR')}
                </strong>
              </div>
            )}
            <div className="confirm-row">
              <span>Voyageurs</span>
              <strong>{reservation?.quantity} personne{reservation?.quantity > 1 ? 's' : ''}</strong>
            </div>
            <div className="confirm-row">
              <span>Tarif unitaire</span>
              <strong>{trip?.price} DT / pers.</strong>
            </div>
            <div className="confirm-row confirm-total">
              <span>Montant total de la transaction</span>
              <strong>{total} DT</strong>
            </div>
          </div>

          <div className="confirm-instructions">
            <h3>📋 Modalités de règlement sous 48 heures</h3>
            <p>
              Votre réservation est maintenant enregistrée. Il ne vous reste plus qu'à effectuer votre règlement sous 48h :
            </p>
            <ul>
              <li><strong>En Agence TravelPlan :</strong> Avec votre référence <strong>#{refCode}</strong> (espèces, chèque ou TPE).</li>
              <li><strong>Par Virement Bancaire :</strong> Sur le compte <code>RIB: 08 000 0001234567890 12</code> (Banque de Tunisie) en indiquant la référence <strong>#{refCode}</strong>.</li>
            </ul>
          </div>

          <div className="confirm-actions">
            <Link to="/mes-reservations" className="btn btn-primary btn-block">
              Accéder à mes réservations →
            </Link>
            <Link to="/voyages" className="btn btn-outline btn-block">
              Explorer d'autres circuits
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
