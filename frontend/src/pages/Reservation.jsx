import { useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import './Reservation.css'

export default function Reservation() {
  const { id } = useParams()
  const location = useLocation()
  const { trips, currentUser, createReservation } = useApp()
  const navigate = useNavigate()
  const trip = trips.find((t) => t.id === id)
  const [error, setError] = useState('')

  const quantity = location.state?.quantity || 1

  const [submitting, setSubmitting] = useState(false)
  const [confirmedData, setConfirmedData] = useState(null)

  if (!trip) {
    return (
      <section className="section">
        <div className="container empty-state">
          <p>Ce voyage n'existe pas.</p>
          <Link to="/voyages" className="btn btn-outline">Retour aux voyages</Link>
        </div>
      </section>
    )
  }

  const destinationName = trip.destination?.name || trip.destinationName || 'Destination'
  const total = trip.price * quantity
  const isPast = trip.isPast || (trip.returnDate && new Date(trip.returnDate) < new Date())
  const isCanceled = trip.statut === 'Annulé' || trip.status === 'Annulé'

  async function handleConfirm() {
    if (isPast) {
      setError("Ce voyage est déjà passé et ne peut plus être réservé.")
      return
    }
    if (isCanceled) {
      setError("Ce circuit a été annulé.")
      return
    }
    setError('')
    setSubmitting(true)
    const result = await createReservation(trip.id, quantity)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error || "Adresse email invalide ou introuvable. Veuillez vérifier votre adresse.")
      return
    }
    if (!result.data || !result.data.confirmationEmailSent) {
      setError("Adresse email invalide ou introuvable. Échec de l'envoi de l'email de confirmation. Veuillez vérifier votre adresse.")
      return
    }
    setConfirmedData(result.data)
  }

  if (confirmedData) {
    const refCode = confirmedData.id ? confirmedData.id.slice(-8).toUpperCase() : ''

    return (
      <section className="section">
        <div className="container">
          <div className="reserve-card ticket reserve-success-card">
            <div className="reserve-success-icon" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
              ✉
            </div>
            <span className="eyebrow" style={{ color: '#b45309' }}>Action requise</span>
            <h1>Confirmez votre réservation par email</h1>
            
            <div className="email-sent-banner" style={{ borderLeftColor: '#d4af37' }}>
              <span className="email-icon">📧</span>
              <div>
                <strong>Email de vérification envoyé avec succès !</strong>
                <p>
                  Un email contenant le lien sécurisé <strong>« Confirmer ma réservation »</strong> vient d'être expédié à votre adresse :
                  <br />
                  <span className="recipient-email">{currentUser?.email}</span>
                </p>
                <p style={{ marginTop: '8px', fontSize: '0.86rem', color: '#78350f' }}>
                  ⏱ <em>Veuillez ouvrir cet email et cliquer sur le lien sous <strong>48 heures</strong> pour bloquer définitivement votre place et passer votre dossier en statut « Confirmée ».</em>
                </p>
              </div>
            </div>

            <div className="reserve-summary-box">
              <div className="reserve-row">
                <span>Référence provisoire</span>
                <strong>#{refCode}</strong>
              </div>
              <div className="reserve-row">
                <span>Statut actuel</span>
                <strong style={{ color: '#d97706' }}>⏳ En attente de confirmation email</strong>
              </div>
              <div className="reserve-row">
                <span>Destination</span>
                <strong>📍 {destinationName}</strong>
              </div>
              <div className="reserve-row">
                <span>Circuit</span>
                <strong>{trip.title}</strong>
              </div>
              <div className="reserve-row">
                <span>Dates du séjour</span>
                <strong>
                  {new Date(trip.departureDate).toLocaleDateString('fr-FR')} →{' '}
                  {new Date(trip.returnDate).toLocaleDateString('fr-FR')}
                </strong>
              </div>
              <div className="reserve-row">
                <span>Nombre de voyageurs</span>
                <strong>{quantity} personne{quantity > 1 ? 's' : ''}</strong>
              </div>
              <div className="reserve-row">
                <span>Tarif unitaire</span>
                <strong>{trip.price} DT / pers.</strong>
              </div>
              {confirmedData.expiresAt && (
                <div className="reserve-row">
                  <span>Délai limite de validation</span>
                  <strong style={{ color: '#b45309' }}>{confirmedData.expiresAt}</strong>
                </div>
              )}
              <div className="reserve-row reserve-total">
                <span>Montant total de la transaction</span>
                <strong>{total} DT</strong>
              </div>
            </div>

            <div className="reserve-success-actions">
              <Link to="/mes-reservations" className="btn btn-primary btn-block">
                Consulter mes réservations
              </Link>
              <Link to="/voyages" className="btn btn-outline btn-block">
                Retour aux voyages
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <div className="reserve-card ticket">
          <span className="eyebrow">Réservation</span>
          <h1>Confirmer votre réservation</h1>

          <div className="reserve-row">
            <span>Destination</span>
            <strong>📍 {destinationName}</strong>
          </div>
          <div className="reserve-row">
            <span>Circuit sélectionné</span>
            <strong>{trip.title}</strong>
          </div>
          <div className="reserve-row">
            <span>Dates du séjour</span>
            <strong>
              {new Date(trip.departureDate).toLocaleDateString('fr-FR')} →{' '}
              {new Date(trip.returnDate).toLocaleDateString('fr-FR')}
            </strong>
          </div>
          <div className="reserve-row">
            <span>Tarif unitaire</span>
            <strong>{trip.price} DT / personne</strong>
          </div>
          <div className="reserve-row">
            <span>Nombre de voyageurs</span>
            <strong>{quantity}</strong>
          </div>
          <div className="reserve-row">
            <span>Titulaire</span>
            <strong>{currentUser?.firstName} {currentUser?.lastName}</strong>
          </div>
          <div className="reserve-row">
            <span>Email de réception</span>
            <strong>{currentUser?.email}</strong>
          </div>

          <div className="perforation" />

          <div className="reserve-row reserve-total">
            <span>Montant de la transaction</span>
            <strong>{total} DT</strong>
          </div>

          <div className="reserve-info-note">
            ℹ Dès votre clic, un email avec un lien de confirmation sécurisé vous sera envoyé. Cliquez sur le lien dans l'email pour valider définitivement votre réservation.
          </div>

          {error && (
            <div className="auth-error" style={{ margin: '18px 0 10px', background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }} role="alert">
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⚠️</span>
              <div style={{ lineHeight: '1.45' }}>
                <strong style={{ display: 'block', marginBottom: '2px', color: '#7f1d1d' }}>Impossible d'envoyer la confirmation :</strong>
                <div>{error}</div>
              </div>
            </div>
          )}

          {isPast && (
            <div className="auth-error" style={{ margin: '18px 0 10px', background: '#f1f5f9', border: '1.5px solid #cbd5e1', color: '#334155', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }} role="status">
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⌛</span>
              <div style={{ lineHeight: '1.45' }}>
                <strong style={{ display: 'block', marginBottom: '2px', color: '#1e293b' }}>Voyage passé :</strong>
                <div>Les dates de ce circuit sont échues. Aucune nouvelle réservation ne peut être confirmée.</div>
              </div>
            </div>
          )}

          <button className="btn btn-primary btn-block" onClick={handleConfirm} disabled={submitting || isPast || isCanceled}>
            {isPast ? '⌛ Voyage passé (Réservation impossible)' : isCanceled ? '🚫 Circuit annulé' : submitting ? 'Enregistrement & Envoi email en cours…' : 'Confirmer la réservation'}
          </button>
          <Link to={`/voyages/${trip.id}`} className="reserve-cancel">
            Annuler et revenir aux détails
          </Link>
        </div>
      </div>
    </section>
  )
}