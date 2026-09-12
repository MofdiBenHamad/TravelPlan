import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/client.js'
import TripCard from '../components/TripCard.jsx'
import './Home.css'

export default function Home() {
  const { trips, destinations, openRegisterModal } = useApp()
  const featured = trips.slice(0, 3)
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    async function loadReviews() {
      const res = await api.get('/reviews/published')
      if (res.ok) setReviews(res.data)
    }
    loadReviews()
  }, [])

  return (
    <div>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Embarquement immédiat</span>
            <h1>
              Réservez votre prochain voyage .
            </h1>
            <p className="hero-lead">
              TravelPlan centralise les destinations internationales, leurs multiples circuits et vos
              réservations sur une seule plateforme haut de gamme.
            </p>
            <div className="hero-actions">
              <Link to="/voyages" className="btn btn-primary">
                Découvrir nos voyages
              </Link>
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={openRegisterModal}
              >
                Commencer l’aventure
              </button>
            </div>
          </div>

          <div className="hero-stub ticket">
            <div className="hero-stub-row">
              <span className="eyebrow">Destination</span>
              <span className="eyebrow">Départ</span>
            </div>
            <div className="hero-stub-row hero-stub-main">
              <strong>Paris Découverte</strong>
              <strong>15 Sept</strong>
            </div>
            <div className="hero-stub-perf" />
            <div className="hero-stub-row">
              <span>Prix unitaire</span>
              <span>500 DT / pers.</span>
            </div>
            <div className="hero-stub-row">
              <span>Places</span>
              <span className="status-tag status-confirmed">20 disponibles</span>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations Phares */}
      {destinations.length > 0 && (
        <section className="section" style={{ background: '#ffffff' }}>
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Destinations</span>
                <h2>Nos destinations phares</h2>
              </div>
              <Link to="/voyages" className="btn btn-outline">
                Explorer tout le catalogue
              </Link>
            </div>
            <div className="destinations-filter-bar">
              {destinations.map((d) => (
                <Link
                  key={d.id}
                  to="/voyages"
                  className="dest-chip"
                  style={{ textDecoration: 'none' }}
                >
                  📍 {d.name} · {d.tripsCount || d.trips?.length || 0} circuits dès {d.minPrice} DT
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sélection de circuits */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Sélection</span>
              <h2>Circuits & séjours du moment</h2>
            </div>
            <Link to="/voyages" className="btn btn-outline">
              Tous les voyages
            </Link>
          </div>
          <div className="trip-grid">
            {featured.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="section reviews-section">
          <div className="container">
            <span className="eyebrow">Témoignages</span>
            <h2>Ce que disent nos voyageurs</h2>
            <div className="reviews-scroll">
              {reviews.map((r) => (
                <div key={r.id} className="review-tile ticket">
                  <span className="review-tile-stars">
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </span>
                  <p>« {r.comment} »</p>
                  <div className="review-tile-footer">
                    <strong>{r.traveler}</strong>
                    <span>{r.tripTitle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section how-section">
        <div className="container">
          <span className="eyebrow">Comment ça marche</span>
          <h2>Trois étapes, un voyage confirmé</h2>
          <div className="how-grid">
            <div className="how-card">
              <span className="how-index">01</span>
              <h3>Choisissez votre destination</h3>
              <p>Explorez les destinations et comparez les circuits et programmes disponibles.</p>
            </div>
            <div className="how-card">
              <span className="how-index">02</span>
              <h3>Réservez vos places</h3>
              <p>Sélectionnez le nombre de voyageurs et confirmez votre réservation immédiatement.</p>
            </div>
            <div className="how-card">
              <span className="how-index">03</span>
              <h3>Finalisez votre transaction</h3>
              <p>Recevez les instructions personnalisées par email pour finaliser votre transaction.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}