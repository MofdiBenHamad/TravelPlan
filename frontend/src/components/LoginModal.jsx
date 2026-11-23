import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import './LoginModal.css'

export default function LoginModal() {
  const { authModal, closeAuthModal, setAuthModalMode, login, register } = useApp()
  const navigate = useNavigate()

  const isOpen = authModal.isOpen
  const mode = authModal.mode // 'login' | 'register'

  // État formulaire Connexion
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  
  // État formulaire Inscription
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const firstInputRef = useRef(null)

  // Fermeture par la touche Échap & gestion du scroll body
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        closeAuthModal()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      setError('')
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    } else {
      document.body.style.overflow = ''
      setError('')
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, mode, closeAuthModal])

  if (!isOpen) return null

  function handleLoginChange(e) {
    setLoginForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  function handleRegisterChange(e) {
    setRegisterForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  // --- Soumission Connexion ---
  async function handleLoginSubmit(e) {
    e.preventDefault()
    setError('')

    const cleanEmail = loginForm.email.trim()
    if (!cleanEmail || !loginForm.password) {
      setError('Veuillez renseigner votre adresse email et votre mot de passe.')
      return
    }

    setIsSubmitting(true)
    const result = await login(cleanEmail, loginForm.password)
    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    closeAuthModal()
    if (result.user?.role === 'ADMIN') {
      navigate('/admin/statistiques')
    }
  }

  // --- Soumission Inscription ---
  async function handleRegisterSubmit(e) {
    e.preventDefault()
    setError('')

    const { firstName, lastName, email, password, confirmPassword } = registerForm
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }

    const cleanEmail = email.trim()
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(cleanEmail)) {
      setError("Format d'adresse email invalide. Veuillez saisir une adresse réelle (ex: nom@gmail.com).")
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setIsSubmitting(true)
    const result = await register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      password,
    })
    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    closeAuthModal()
  }

  function handleQuickFill(email, password) {
    setLoginForm({ email, password })
    setError('')
  }

  const isEmailError = error && (error.toLowerCase().includes('email') || error.toLowerCase().includes('adresse') || error.toLowerCase().includes('domaine'))
  const isPasswordError = error && error.toLowerCase().includes('mot de passe')

  return (
    <div className="login-modal-overlay" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div className="login-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Bouton de fermeture (X) */}
        <button
          className="login-modal-close-btn"
          onClick={closeAuthModal}
          aria-label="Fermer la boîte de dialogue"
        >
          ✕
        </button>

        {/* En-tête Dynamique */}
        <div className="login-modal-header">
          <div className="login-modal-stamp">
            <span className="login-modal-stamp-mark">✈</span>
            <span>{mode === 'login' ? 'Espace Voyageur' : 'Nouveau Voyageur'}</span>
          </div>
          <h2>{mode === 'login' ? 'Ravis de vous revoir' : 'Rejoignez TravelPlan'}</h2>
          <p className="login-modal-subtitle">
            {mode === 'login'
              ? 'Connectez-vous pour gérer vos séjours et valider vos réservations.'
              : 'Créez votre compte en quelques secondes et planifiez vos séjours.'}
          </p>
        </div>

        {/* Formulaire de Connexion */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="login-modal-form" noValidate>
            <div className="login-modal-field">
              <label htmlFor="modal-login-email">Adresse Email</label>
              <input
                ref={firstInputRef}
                id="modal-login-email"
                name="email"
                type="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                placeholder="vous@email.com"
                autoComplete="email"
                style={isEmailError ? { borderColor: '#ef4444', background: '#fef2f2' } : {}}
                required
              />
            </div>

            <div className="login-modal-field">
              <label htmlFor="modal-login-password">Mot de passe</label>
              <input
                id="modal-login-password"
                name="password"
                type="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder="••••••••"
                autoComplete="current-password"
                style={isPasswordError ? { borderColor: '#ef4444', background: '#fef2f2' } : {}}
                required
              />
            </div>

            {/* Affichage des Erreurs */}
            {error && (
              <div className="login-modal-error" role="alert">
                <span className="login-error-icon">⚠️</span>
                <div className="login-error-content">
                  <strong>Erreur d'authentification :</strong>
                  <div>{error}</div>
                  {isEmailError && error.includes("n'existe pas") && (
                    <div className="login-error-link">
                      👉 Pas encore inscrit ?{' '}
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => {
                          setAuthModalMode('register')
                          setError('')
                        }}
                      >
                        Créez votre compte en 1 minute
                      </button>
                    </div>
                  )}
                  {error.toLowerCase().includes('confirmer') && (
                    <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#7f1d1d' }}>
                      ℹ️ Veuillez vérifier votre boîte de réception (et spams) pour activer votre compte.
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block login-modal-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Connexion en cours…' : 'Se connecter'}
            </button>

            {/* Bascule vers Inscription */}
            <div className="login-modal-footer">
              <p className="login-modal-switch">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setAuthModalMode('register')
                    setError('')
                  }}
                >
                  Créer un compte
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* Formulaire d'Inscription */
          <form onSubmit={handleRegisterSubmit} className="login-modal-form" noValidate>
            <div className="modal-row-fields">
              <div className="login-modal-field">
                <label htmlFor="modal-reg-firstname">Prénom</label>
                <input
                  ref={firstInputRef}
                  id="modal-reg-firstname"
                  name="firstName"
                  type="text"
                  value={registerForm.firstName}
                  onChange={handleRegisterChange}
                  placeholder="Ahmed"
                  required
                />
              </div>
              <div className="login-modal-field">
                <label htmlFor="modal-reg-lastname">Nom</label>
                <input
                  id="modal-reg-lastname"
                  name="lastName"
                  type="text"
                  value={registerForm.lastName}
                  onChange={handleRegisterChange}
                  placeholder="Ben Ali"
                  required
                />
              </div>
            </div>

            <div className="login-modal-field">
              <label htmlFor="modal-reg-email">Adresse Email Réelle</label>
              <input
                id="modal-reg-email"
                name="email"
                type="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                placeholder="ahmed.benali@gmail.com"
                autoComplete="email"
                style={isEmailError ? { borderColor: '#ef4444', background: '#fef2f2' } : {}}
                required
              />
              <span className="field-hint-mini">Un email réel et délivrable est requis pour vos confirmations.</span>
            </div>

            <div className="modal-row-fields">
              <div className="login-modal-field">
                <label htmlFor="modal-reg-password">Mot de passe</label>
                <input
                  id="modal-reg-password"
                  name="password"
                  type="password"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="login-modal-field">
                <label htmlFor="modal-reg-confirm">Confirmation</label>
                <input
                  id="modal-reg-confirm"
                  name="confirmPassword"
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* Affichage des Erreurs */}
            {error && (
              <div className="login-modal-error" role="alert">
                <span className="login-error-icon">⚠️</span>
                <div className="login-error-content">
                  <strong>Erreur de création de compte :</strong>
                  <div>{error}</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block login-modal-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Validation & Création…' : 'Créer mon compte'}
            </button>

            {/* Bascule vers Connexion */}
            <div className="login-modal-footer">
              <p className="login-modal-switch">
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setAuthModalMode('login')
                    setError('')
                  }}
                >
                  Se connecter
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
