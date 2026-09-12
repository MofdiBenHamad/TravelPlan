import { Link } from 'react-router-dom'
import './TripCard.css'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function TripCard({ trip }) {
  const isPast = trip.isPast || (trip.returnDate && new Date(trip.returnDate) < new Date())
  const isCanceled = trip.statut === 'Annulé' || trip.status === 'Annulé'
  const full = !isPast && !isCanceled && trip.availablePlaces <= 0
  const destination = trip.destination?.name || trip.destinationName || 'Destination'

  return (
    <article className={`trip-card ticket ${isPast ? 'is-past-card' : ''}`}>
      <div className="trip-card-image">
        <img src={trip.image} alt={trip.title} loading="lazy" />
        <span className="trip-card-price">{trip.price} DT / pers.</span>
        {isPast && (
          <span className="trip-card-badge badge-past">
            ⌛ Voyage passé
          </span>
        )}
        {isCanceled && (
          <span className="trip-card-badge badge-canceled">
            🚫 Annulé
          </span>
        )}
      </div>
      <div className="trip-card-body">
        <span className="eyebrow">{destination}</span>
        <h3>{trip.title}</h3>
        <div className="trip-card-dates">
          {formatDate(trip.departureDate)} → {formatDate(trip.returnDate)}
        </div>
        <div className="trip-card-perf" />
        <div className="trip-card-footer">
          {isPast ? (
            <span className="trip-card-places is-past">Voyage terminé</span>
          ) : isCanceled ? (
            <span className="trip-card-places is-canceled">Circuit annulé</span>
          ) : (
            <span className={full ? 'trip-card-places is-full' : 'trip-card-places'}>
              {full ? 'Complet' : `${trip.availablePlaces} places dispo.`}
            </span>
          )}
          <Link to={`/voyages/${trip.id}`} className="btn btn-outline">
            Voir détails
          </Link>
        </div>
      </div>
    </article>
  )
}