import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api } from '../api/client.js'
import './VerifyEmail.css'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [alreadyVerified, setAlreadyVerified] = useState(false)

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError('Aucun jeton de vérification fourni dans le lien.')
        setLoading(false)
        return
      }

      const res = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      setLoading(false)

      if (!res.ok) {
        setError(res.error || 'Impossible d\'activer ce compte.')
        return
      }

      setSuccessMsg(res.data.message || 'Votre compte a été activé avec succès.')
      setAlreadyVerified(Boolean(res.data.alreadyVerified))
    }

    verify()
  }, [token])

  if (loading) {
    return (
      <section className="section">
        <div className="container verify-email-container">
          <div className="verify-email-card ticket">
            <div className="verify-email-spinner">✈</div>
            <h2>Activation de votre compte en cours…</h2>
            <p>Vérification de votre jeton d'authentification.</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section">
        <div className="container verify-email-container">
          <div className="verify-email-card ticket verify-error-card">
            <div className="verify-error-icon">⚠️</div>
            <span className="eyebrow">Échec de l'activation</span>
            <h1>Lien d'activation invalide</h1>
            <p className="verify-error-msg">{error}</p>
            <div className="verify-actions">
              <Link to="/inscription" className="btn btn-primary">
                Créer un nouveau compte
              </Link>
              <Link to="/connexion" className="btn btn-outline">
                Page de connexion
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container verify-email-container">
        <div className="verify-email-card ticket verify-success-card">
          <div className="verify-badge-icon">✓</div>
          <span className="eyebrow">
            {alreadyVerified ? 'Compte déjà activé' : 'Activation réussie'}
          </span>
          <h1>
            {alreadyVerified
              ? 'Votre compte est déjà actif !'
              : 'Bienvenue chez TravelPlan !'}
          </h1>
          <p className="verify-subtitle">
            {alreadyVerified
              ? 'Votre adresse email a déjà été vérifiée. Vous pouvez accéder directement à votre espace membre.'
              : 'Votre adresse email a été confirmée avec succès. Vous pouvez désormais vous connecter et réserver vos séjours en toute liberté.'}
          </p>

          <div className="verify-actions">
            <Link to="/connexion" className="btn btn-primary btn-block">
              Se connecter à mon compte →
            </Link>
            <Link to="/voyages" className="btn btn-outline btn-block">
              Découvrir nos circuits
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
