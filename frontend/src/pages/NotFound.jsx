import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <section className="section notfound">
      <div className="container">
        <span className="eyebrow">Erreur 404</span>
        <h1>Ce vol n'existe pas</h1>
        <p>La page que vous cherchez a été déroutée ou n'a jamais décollé.</p>
        <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
      </div>
    </section>
  )
}
