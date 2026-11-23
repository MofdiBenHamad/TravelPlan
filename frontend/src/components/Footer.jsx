import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import './Footer.css'

export default function Footer() {
  const { currentUser } = useApp()
  const currentYear = new Date().getFullYear()

  const isAdmin = currentUser?.role === 'ADMIN'
  const isTraveler = currentUser?.role === 'VOYAGEUR'

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/mofdi.benhamad',
      icon: (
        <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com',
      icon: (
        <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com',
      icon: (
        <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
    },
  ]

  // ========================================================
  // 1. FOOTER MODE ADMINISTRATEUR (role === 'ADMIN')
  // ========================================================
  if (isAdmin) {
    return (
      <footer className="footer-role footer-role-admin">
        <div className="container footer-container">
          <div className="footer-admin-main">
            {/* Colonne Gauche : Titre Espace Administration */}
            <div className="footer-admin-brand-col">
              <div className="footer-admin-brand">
                <span className="footer-admin-mark">✈</span>
                <span className="footer-admin-title">TravelPlan</span>
                <span className="footer-admin-badge">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Espace Administration
                </span>
              </div>
              <p className="footer-admin-desc">
                Console centralisée de supervision, de gestion des voyages et de suivi des réservations.
              </p>
            </div>

            {/* Colonne Milieu : Liens Rapides de Gestion */}
            <div className="footer-admin-links-col">
              <span className="footer-col-heading">GESTION GLOBALE</span>
              <nav className="footer-admin-nav" aria-label="Navigation administration pied de page">
                <Link to="/admin/statistiques">Statistiques</Link>
                <Link to="/admin/voyages">Gestion Voyages</Link>
                <Link to="/admin/reservations">Réservations</Link>
                <Link to="/admin/participants">Participants</Link>
                <Link to="/admin/transactions">Transactions</Link>
              </nav>
            </div>

            {/* Colonne Droite : Indicateur Statut & Version Système */}
            <div className="footer-admin-status-col">
              <span className="footer-col-heading">ÉTAT DU SYSTÈME</span>
              <div className="footer-status-pill">
                <span className="status-indicator-dot" />
                <span className="status-text">Système opérationnel</span>
              </div>
              <div className="footer-system-meta">
                <span className="system-version">v2.4.0</span>
                <span className="system-sep">•</span>
                <span className="system-security">Espace sécurisé (ADMIN)</span>
              </div>
              <Link to="/" className="footer-preview-link" title="Prévisualiser le site public voyageur">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Voir le site public</span>
              </Link>
            </div>
          </div>

          {/* Ligne de Séparation */}
          <div className="footer-divider-subtle" />

          {/* Ligne Inférieure Admin */}
          <div className="footer-admin-bottom">
            <p className="footer-copyright-text">
              © {currentYear} <strong>TravelPlan Administration</strong>. Plateforme interne réservée aux administrateurs habilités.
            </p>
            <div className="footer-admin-meta-links">
              <Link to="/profil">Profil Admin ({currentUser.firstName})</Link>
              <span className="meta-sep">•</span>
              <Link to="/admin/messages">Messagerie</Link>
              <span className="meta-sep">•</span>
              <Link to="/admin/avis">Avis Voyageurs</Link>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  // ========================================================
  // 2. FOOTER MODE VOYAGEUR & VISITEUR (VOYAGEUR ou non authentifié)
  // ========================================================
  return (
    <footer className="footer-role footer-role-traveler">
      <div className="container footer-container">
        <div className="footer-traveler-grid">
          {/* Colonne 1 : Résumé de Marque TravelPlan */}
          <div className="footer-traveler-brand-col">
            <Link to="/" className="footer-traveler-brand">
              <span className="footer-traveler-mark">✈</span>
              <span className="footer-traveler-name">TravelPlan</span>
            </Link>
            <p className="footer-traveler-summary">
              Plateforme haut de gamme dédiée aux voyages internationaux d'exception.
              Explorez des destinations uniques, comparez des circuits soigneusement élaborés
              et réservez votre prochaine aventure en toute sérénité.
            </p>
            <div className="footer-social-cluster">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="footer-social-icon-btn"
                  aria-label={s.name}
                  title={s.name}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Colonne 2 : Navigation Rapide */}
          <div className="footer-traveler-nav-col">
            <span className="footer-col-heading">NAVIGATION</span>
            <nav className="footer-nav-list" aria-label="Navigation voyageur pied de page">
              <Link to="/">Accueil</Link>
              <Link to="/voyages">Destinations & Circuits</Link>
              {isTraveler && (
                <Link to="/mes-reservations" className="footer-highlight-link">
                  Mes Réservations
                </Link>
              )}
              <Link to="/about">À propos de nous</Link>
              <Link to="/contact">Contactez-nous</Link>
            </nav>
          </div>

          {/* Colonne 3 : Assistance & Contact Client */}
          <div className="footer-traveler-contact-col">
            <span className="footer-col-heading">ASSISTANCE CLIENT</span>
            <ul className="footer-contact-items">
              <li className="footer-contact-item">
                <Mail className="w-4 h-4 footer-contact-icon" />
                <a href="mailto:contact@travelplan.tn">contact@travelplan.tn</a>
              </li>
              <li className="footer-contact-item">
                <Phone className="w-4 h-4 footer-contact-icon" />
                <a href="tel:+21671000000">+216 71 000 000</a>
              </li>
              <li className="footer-contact-item">
                <MapPin className="w-4 h-4 footer-contact-icon" />
                <span>Tunis, Tunisie • Siège TravelPlan</span>
              </li>
              <li className="footer-contact-item footer-hours-item">
                <Clock className="w-4 h-4 footer-contact-icon" />
                <span>Service client 7j/7 de 8h à 20h</span>
              </li>
            </ul>
            <div className="footer-support-badge">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Garantie réservation & assistance voyage</span>
            </div>
          </div>
        </div>

        {/* Ligne de Séparation Subtile */}
        <div className="footer-divider-subtle" />

        {/* Ligne Inférieure Voyageur : Copyright & Mentions */}
        <div className="footer-traveler-bottom">
          <p className="footer-copyright-text">
            © {currentYear} <strong>TravelPlan</strong>. Tous droits réservés. L'évasion commence ici.
          </p>
          <div className="footer-traveler-legal-links">
            <Link to="/about">Confidentialité</Link>
            <span className="meta-sep">•</span>
            <Link to="/contact">Conditions Générales</Link>
            <span className="meta-sep">•</span>
            <Link to="/contact">Mentions Légales</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
