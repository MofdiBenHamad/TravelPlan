import { useEffect } from 'react'
import './ConfirmModal.css'

export default function ConfirmModal({
  isOpen,
  title = "Confirmer l'annulation",
  message = "Êtes-vous sûr de vouloir annuler ?",
  itemTitle,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isDanger = true,
  loading = false,
  onConfirm,
  onClose,
}) {
  // Fermeture par la touche Échap & gestion du scroll du body
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  return (
    <div className="confirm-modal-overlay" onClick={!loading ? onClose : undefined} role="dialog" aria-modal="true">
      <div className="confirm-modal-box ticket" onClick={(e) => e.stopPropagation()}>
        {/* Bouton de Fermeture (X) */}
        {!loading && (
          <button
            type="button"
            className="confirm-modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        )}

        <div className="confirm-modal-body">
          <h3 className="confirm-modal-title">{title}</h3>
          
          {itemTitle && (
            <p className="confirm-modal-item">
              <strong>{itemTitle}</strong>
            </p>
          )}

          <p className="confirm-modal-text">{message}</p>
        </div>

        {/* Boutons d'Action Minimalistes */}
        <div className="confirm-modal-footer">
          <button
            type="button"
            className="btn btn-outline confirm-modal-btn"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'} confirm-modal-btn`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Traitement…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
