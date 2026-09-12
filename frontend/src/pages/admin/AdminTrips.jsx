import { useState, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminTripModal from '../../components/AdminTripModal.jsx'
import ConfirmModal from '../../components/ConfirmModal.jsx'
import Pagination from '../../components/Pagination.jsx'
import './AdminTrips.css'

export default function AdminTrips() {
  const { trips, destinations, addTrip, updateTrip, deleteTrip } = useApp()
  
  // Pagination (5 éléments par page par défaut)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const tableRef = useRef(null)

  // Contrôle explicite de l'état du modal d'ajout/édition
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState(null)
  
  // Contrôle de la modale de confirmation d'annulation
  const [tripToCancel, setTripToCancel] = useState(null)
  const [isCanceling, setIsCanceling] = useState(false)

  const [globalError, setGlobalError] = useState('')

  // Déclenchement création d'un nouveau voyage
  function handleOpenAdd() {
    setSelectedTrip(null)
    setGlobalError('')
    setIsModalOpen(true)
  }

  // Déclenchement modification d'un voyage existant
  function handleOpenEdit(trip) {
    setSelectedTrip(trip)
    setGlobalError('')
    setIsModalOpen(true)
  }

  // Fermeture propre du modal d'ajout/édition
  function handleCloseModal() {
    setIsModalOpen(false)
    setSelectedTrip(null)
  }

  // Sauvegarde (Création ou Mise à jour)
  async function handleSaveTrip(payload, tripId) {
    const result = tripId ? await updateTrip(tripId, payload) : await addTrip(payload)
    if (result && result.ok) {
      handleCloseModal()
    }
    return result
  }

  // Déclenchement modal de confirmation pour annuler un voyage
  function handlePromptCancel(trip) {
    setTripToCancel(trip)
    setGlobalError('')
  }

  // Confirmation de l'annulation du voyage
  async function handleConfirmCancellation() {
    if (!tripToCancel) return
    setIsCanceling(true)
    const result = await deleteTrip(tripToCancel.id)
    setIsCanceling(false)

    if (!result.ok) {
      setGlobalError(result.error || "Une erreur est survenue lors de l'annulation du voyage.")
    }
    setTripToCancel(null)
  }

  // Découpage paginé des voyages (5 par page)
  const totalItems = trips.length
  const paginatedTrips = trips.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <AdminLayout eyebrow="Gestion" title="Circuits & Voyages">
      <div className="admin-trips-head">
        <p>{trips.length} circuit(s) réparti(s) sur {destinations.length} destination(s).</p>
        <button
          type="button"
          className="btn btn-primary admin-add-trip-btn"
          onClick={handleOpenAdd}
        >
          + Ajouter un voyage
        </button>
      </div>

      {globalError && (
        <div className="auth-error" style={{ marginBottom: '20px' }} role="alert">
          <span>⚠️</span>
          <span>{globalError}</span>
        </div>
      )}

      {/* MODAL POPUP : Création & Édition de voyage */}
      <AdminTripModal
        isOpen={isModalOpen}
        trip={selectedTrip}
        onClose={handleCloseModal}
        onSave={handleSaveTrip}
      />

      {/* MODAL POPUP : Confirmation d'Annulation de voyage */}
      <ConfirmModal
        isOpen={Boolean(tripToCancel)}
        title="Annuler ce voyage ?"
        itemTitle={tripToCancel ? `${tripToCancel.title} (${tripToCancel.destination?.name || tripToCancel.destinationName || tripToCancel.destination})` : ''}
        message="Êtes-vous sûr de vouloir annuler ce voyage ? Les inscrits seront notifiés par email."
        confirmText="Confirmer"
        cancelText="Annuler"
        isDanger={true}
        loading={isCanceling}
        onConfirm={handleConfirmCancellation}
        onClose={() => !isCanceling && setTripToCancel(null)}
      />

      {/* TABLEAU DES VOYAGES EXISTANTS (PAGINÉ) */}
      <div ref={tableRef} className="trip-table ticket">
        <div className="trip-table-header">
          <span>Circuit & Destination</span>
          <span>Dates</span>
          <span>Tarif</span>
          <span>Places</span>
          <span>Actions</span>
        </div>
        {paginatedTrips.map((t) => {
          const isPast = t.isPast || (t.returnDate && new Date(t.returnDate) < new Date())
          const isCanceled = t.status === 'Annulé' || t.statut === 'Annulé'
          return (
            <div className="trip-table-row" key={t.id} style={{ opacity: isCanceled || isPast ? 0.78 : 1 }}>
              <div className="trip-table-name">
                <img src={t.image} alt="" />
                <div>
                  <strong>{t.title}</strong>
                  <span>📍 {t.destination?.name || t.destinationName}</span>
                  {isCanceled ? (
                    <span style={{ display: 'inline-block', background: '#fee2e2', color: '#991b1b', fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>
                      ✕ Circuit Annulé
                    </span>
                  ) : isPast ? (
                    <span style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginTop: '4px', border: '1px solid #cbd5e1' }}>
                      ⌛ Voyage Passé
                    </span>
                  ) : null}
                </div>
              </div>
              <span>
                {new Date(t.departureDate).toLocaleDateString('fr-FR')} →{' '}
                {new Date(t.returnDate).toLocaleDateString('fr-FR')}
              </span>
              <strong style={{ color: '#d4af37' }}>{t.price} DT / pers.</strong>
              <span>{t.availablePlaces} / {t.totalPlaces}</span>
              <div className="trip-table-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleOpenEdit(t)}
                  disabled={isCanceled}
                  title="Modifier ce voyage dans la boîte modale"
                >
                  ✏ Modifier
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handlePromptCancel(t)}
                  disabled={isCanceled}
                  title="Annule le circuit, le retire du catalogue et notifie les voyageurs inscrits"
                >
                  {isCanceled ? 'Annulé' : 'Annuler'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* CONTRÔLE DE PAGINATION (5 PAR PAGE) */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        itemLabel="voyages"
        tableRef={tableRef}
      />
    </AdminLayout>
  )
}