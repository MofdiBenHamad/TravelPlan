import { useState } from 'react'
import { api } from '../api/client.js'
import './Contact.css'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    const res = await api.post('/contact', form)
    setSending(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setSent(true)
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <section className="section">
      <div className="container contact-layout">
        <div className="contact-intro">
          <span className="eyebrow">Contact</span>
          <h1>Une question ? Écrivez-nous</h1>
          <p>
            Notre équipe répond à vos demandes concernant les voyages, les réservations ou les
            paiements sous 48h ouvrées.
          </p>
          <ul className="contact-info">
            <li><strong>Email</strong><span>contact@travelplan.tn</span></li>
            <li><strong>Adresse</strong><span>Tunis, Tunisie</span></li>
            <li><strong>Horaires</strong><span>Lun–Ven, 9h–18h</span></li>
          </ul>
        </div>

        <form className="contact-form ticket" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Nom</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="subject">Sujet</label>
            <input id="subject" name="subject" value={form.subject} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={5} value={form.message} onChange={handleChange} required />
          </div>

          {sent && <p className="profile-saved">Votre message a été envoyé, merci !</p>}
          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
            {sending ? 'Envoi…' : 'Envoyer le message'}
          </button>
        </form>
      </div>
    </section>
  )
}