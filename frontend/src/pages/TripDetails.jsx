import { useState, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import TripImageCarousel from '../components/TripImageCarousel.jsx'
import './TripDetails.css'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function calculateDays(dep, ret) {
  if (!dep || !ret) return null
  const diffTime = Math.abs(new Date(ret) - new Date(dep))
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 1
}

export default function TripDetails() {
  const { id } = useParams()
  const { trips, currentUser } = useApp()
  const navigate = useNavigate()
  
  const trip = trips.find((t) => t.id === id)
  const [quantity, setQuantity] = useState(1)

  // Rassembler tous les circuits de cette destination
  const destinationTrips = useMemo(() => {
    if (!trip) return []
    const destName = trip.destination?.name || trip.destinationName || ''
    return trips.filter(
      (t) =>
        t.destinationId === trip.destinationId ||
        (t.destination?.name && destName && t.destination?.name === destName)
    )
  }, [trips, trip])

  if (!trip) {
    return (
      <section className="section">
        <div className="container empty-state">
          <p>Ce voyage n'existe pas ou a été supprimé.</p>
          <Link to="/voyages" className="btn btn-outline">
            Retour aux voyages
          </Link>
        </div>
      </section>
    )
  }

  const destinationName = trip.destination?.name || trip.destinationName || 'Destination'
  const isPast = trip.isPast || (trip.returnDate && new Date(trip.returnDate) < new Date())
  const isCanceled = trip.statut === 'Annulé' || trip.status === 'Annulé'
  const full = !isPast && !isCanceled && trip.availablePlaces <= 0
  const isBookable = !isPast && !isCanceled && !full
  const total = trip.price * quantity
  const tripDays = calculateDays(trip.departureDate, trip.returnDate)

  // Galerie d'images complète pour le carrousel automatique (3s)
  const carouselImages = trip.images && trip.images.length > 0
    ? trip.images.map((img) => (typeof img === 'string' ? img : img.url || ''))
    : [trip.image]

  function handleReserve() {
    if (!isBookable) return
    if (!currentUser) {
      navigate('/connexion', { state: { from: `/voyages/${trip.id}` } })
      return
    }
    navigate(`/voyages/${trip.id}/reserver`, {
      state: { quantity },
    })
  }

  function handleSwitchCircuit(targetTripId) {
    if (targetTripId !== trip.id) {
      navigate(`/voyages/${targetTripId}`)
    }
  }

  return (
    <section className="section">
      <div className="container">
        {/* Fil d'Ariane */}
        <div className="details-breadcrumb">
          <Link to="/voyages">Voyages</Link>
          <span>›</span>
          <span>{destinationName}</span>
          <span>›</span>
          <span className="breadcrumb-current">{trip.title}</span>
        </div>

        {/* ===========================================================
            1. DÉTAILS PRINCIPAUX DU VOYAGE (MÉDIA + CORPS + RÉSERVATION)
            =========================================================== */}
        <div className="details-layout">
          {/* 📸 CARROUSEL D'IMAGES À DÉFILEMENT AUTOMATIQUE (3s) */}
          <div className="details-media">
            <TripImageCarousel
              images={carouselImages}
              title={trip.title}
            />
          </div>

          {/* Corps de la fiche circuit */}
          <div className="details-body">
            <div className="details-header-tags">
              <span className="eyebrow">📍 {destinationName}</span>
              {tripDays && <span className="duration-pill">⏱ {tripDays} Jours / {Math.max(1, tripDays - 1)} Nuits</span>}
              {isPast && <span className="status-badge-past">⌛ Voyage passé</span>}
              {isCanceled && <span className="status-badge-canceled">🚫 Circuit annulé</span>}
            </div>

            <h1>{trip.title}</h1>
            <p className="details-desc">{trip.description}</p>

            <div className="details-facts">
              <div>
                <span className="details-label">Dates du séjour</span>
                <strong>
                  {formatDate(trip.departureDate)} → {formatDate(trip.returnDate)}
                </strong>
              </div>
              <div>
                <span className="details-label">Tarif par personne</span>
                <strong className="text-price">{trip.price} DT</strong>
              </div>
              <div>
                <span className="details-label">Disponibilité</span>
                <strong className={isPast ? 'text-muted' : isCanceled ? 'text-danger' : full ? 'text-danger' : 'text-available'}>
                  {isPast
                    ? 'Voyage terminé'
                    : isCanceled
                    ? 'Annulé'
                    : full
                    ? 'Complet'
                    : `${trip.availablePlaces} / ${trip.totalPlaces} places`}
                </strong>
              </div>
            </div>

            <h2 className="details-subtitle">Itinéraire détaillé & Programme</h2>
            <ol className="details-program-list">
              {(trip.program || []).map((step, i) => (
                <li key={i} className="details-program-item">
                  <div className="program-step-bullet">{i + 1}</div>
                  <div className="program-step-content">{step}</div>
                </li>
              ))}
            </ol>

            {/* Carte de Réservation Directe */}
            <div className={`booking-card ticket ${isPast ? 'booking-card-past' : ''}`}>
              <div className="booking-card-head">
                <span className="eyebrow">Tarification & Réservation</span>
                <span className="booking-circuit-ref">Réf: {trip.id.slice(-6).toUpperCase()}</span>
              </div>

              <div className="booking-price-header">
                <div>
                  <span className="booking-unit-label">Prix unitaire</span>
                  <strong className="booking-unit-price">{trip.price} DT <small>/ pers.</small></strong>
                </div>

                <div className="offer-quantity-control">
                  <label htmlFor="quantity" style={{ fontSize: '0.84rem', marginRight: '4px', color: 'var(--ink-soft)', fontWeight: 600 }}>
                    Voyageurs :
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || !isBookable}
                    aria-label="Diminuer le nombre de places"
                  >
                    −
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    max={trip.availablePlaces || 1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(1, Math.min(Number(e.target.value) || 1, trip.availablePlaces || 1))
                      )
                    }
                    disabled={!isBookable}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(trip.availablePlaces, q + 1))}
                    disabled={quantity >= trip.availablePlaces || !isBookable}
                    aria-label="Augmenter le nombre de places"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="perforation" />

              <div className="booking-total-row">
                <span>Montant total ({quantity} voyageur{quantity > 1 ? 's' : ''}) :</span>
                <strong>{total} DT</strong>
              </div>

              {isPast && (
                <div className="booking-status-banner banner-past" role="status">
                  ⌛ <strong>Voyage passé :</strong> Ce séjour est terminé depuis le {formatDate(trip.returnDate)}. Les réservations ne sont plus acceptées.
                </div>
              )}
              {isCanceled && (
                <div className="booking-status-banner banner-canceled" role="status">
                  🚫 <strong>Circuit annulé :</strong> Ce voyage a été annulé par l'administration.
                </div>
              )}

              <button
                className="btn btn-primary btn-block btn-booking-action"
                onClick={handleReserve}
                disabled={!isBookable}
              >
                {isPast
                  ? '⌛ Voyage passé (Réservations fermées)'
                  : isCanceled
                  ? '🚫 Circuit annulé'
                  : full
                  ? 'Ce circuit est complet'
                  : '✓ Réserver ce circuit maintenant'}
              </button>
            </div>
          </div>
        </div>

        {/* ===========================================================
            2. SECTION CIRCUITS DISPONIBLES (POSITIONNÉE EN BAS DE PAGE)
            =========================================================== */}
        {destinationTrips.length > 1 && (
          <div className="bottom-circuits-section">
            <div className="bottom-circuits-header">
              <div className="bottom-circuits-title-wrap">
                <span className="circuits-badge-pill">🗺️ Circuits Disponibles</span>
                <h2>Autres itinéraires pour {destinationName}</h2>
                <p className="bottom-circuits-subtitle">
                  Comparez les formules, durées et dates alternatives disponibles pour cette destination ({destinationTrips.length} circuits au total).
                </p>
              </div>
            </div>

            <div className="circuits-cards-grid" role="region" aria-label="Circuits disponibles">
              {destinationTrips.map((cTrip, idx) => {
                const isSelected = cTrip.id === trip.id
                const cDays = calculateDays(cTrip.departureDate, cTrip.returnDate)
                const cImg = cTrip.image || (cTrip.images && cTrip.images[0]?.url)
                const cIsPast = cTrip.isPast || (cTrip.returnDate && new Date(cTrip.returnDate) < new Date())
                const cIsCanceled = cTrip.statut === 'Annulé' || cTrip.status === 'Annulé'

                return (
                  <div
                    key={cTrip.id}
                    className={`circuit-offer-card ${isSelected ? 'is-current-circuit' : ''} ${cIsPast ? 'is-past-offer' : ''}`}
                  >
                    <div className="circuit-offer-media">
                      <img src={cImg} alt={cTrip.title} />
                      <div className="circuit-offer-badges">
                        <span className="circuit-idx-badge">Circuit #{idx + 1}</span>
                        {isSelected && <span className="circuit-active-badge">★ Actuel</span>}
                        {cIsPast && <span className="circuit-past-badge">Passé</span>}
                        {cIsCanceled && <span className="circuit-canceled-badge">Annulé</span>}
                      </div>
                    </div>

                    <div className="circuit-offer-body">
                      <div className="circuit-offer-meta">
                        <span className="circuit-meta-dates">
                          📅 {new Date(cTrip.departureDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} → {new Date(cTrip.returnDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                        {cDays && <span className="circuit-meta-duration">⏱ {cDays}j</span>}
                      </div>

                      <h3 className="circuit-offer-title" title={cTrip.title}>
                        {cTrip.title}
                      </h3>

                      <div className="circuit-offer-footer">
                        <div className="circuit-offer-price">
                          <span className="price-label">Tarif</span>
                          <strong className="price-value">{cTrip.price} DT</strong>
                        </div>

                        {isSelected ? (
                          <span className="btn-circuit-current">Circuit sélectionné</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline btn-circuit-switch"
                            onClick={() => handleSwitchCircuit(cTrip.id)}
                            title={`Consulter : ${cTrip.title}`}
                          >
                            Voir ce circuit →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}