import { Link } from 'react-router-dom'
import './About.css'

export default function About() {
  return (
    <div>
      <section className="section about-hero">
        <div className="container">
          <span className="eyebrow">À propos</span>
          <h1>TravelPlan, une plateforme pensée pour simplifier le voyage</h1>
          <p className="about-lead">
            TravelPlan centralise la gestion des voyages, des réservations et des paiements dans
            une seule application, pour les organisateurs comme pour les voyageurs.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container about-grid">
          <div className="about-block">
            <span className="eyebrow">Notre mission</span>
            <h2>Rendre la réservation de voyage simple et transparente</h2>
            <p>
              Les agences et organisateurs jonglent souvent entre plusieurs outils pour gérer
              leurs offres, leurs places disponibles et leurs paiements. TravelPlan réunit ces
              opérations en un seul endroit, simple et intuitif.
            </p>
          </div>
          <div className="about-block">
            <span className="eyebrow">Nos services</span>
            <h2>Ce que propose la plateforme</h2>
            <ul className="about-list">
              <li>Gestion complète des voyages par l'administrateur</li>
              <li>Consultation et recherche des offres disponibles</li>
              <li>Réservation en ligne avec suivi des places</li>
              <li>Paiement sécurisé et suivi des participants</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section about-cta">
        <div className="container about-cta-inner">
          <h2>Prêt à préparer votre prochain voyage ?</h2>
          <Link to="/voyages" className="btn btn-gold">Voir les voyages</Link>
        </div>
      </section>
    </div>
  )
}
