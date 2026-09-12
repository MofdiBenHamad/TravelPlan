import { useState } from 'react'
import { api } from '../api/client.js'
import './ReviewForm.css'

export default function ReviewForm({ reservationId, tripTitle, onSubmitted }) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!comment.trim()) {
      setError('Merci de partager quelques mots sur votre expérience.')
      return
    }
    setError('')
    setSubmitting(true)
    const res = await api.post('/reviews', { reservationId, rating, comment })
    setSubmitting(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setDone(true)
    onSubmitted?.(res.data)
  }

  if (done) {
    return (
      <div className="review-form review-form-done">
        <span className="eyebrow">Merci !</span>
        <p>Votre avis sur « {tripTitle} » a été envoyé et sera visible après validation par l'administrateur.</p>
      </div>
    )
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <span className="eyebrow">Laisser un avis</span>
      <h3>Comment s'est passé « {tripTitle} » ?</h3>

      <div className="review-stars" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className={`review-star ${(hoverRating || rating) >= n ? 'is-active' : ''}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${n} étoile(s)`}
          >
            ★
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="comment">Votre avis</label>
        <textarea
          id="comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Racontez votre expérience…"
        />
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" className="btn btn-gold btn-block" disabled={submitting}>
        {submitting ? 'Envoi…' : 'Envoyer mon avis'}
      </button>
    </form>
  )
}