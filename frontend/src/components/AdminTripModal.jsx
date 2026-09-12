import { useState, useEffect, useRef } from 'react'
import './AdminTripModal.css'

const emptyForm = {
  title: '',
  destination: '',
  description: '',
  departureDate: '',
  returnDate: '',
  price: '',
  totalPlaces: '',
  program: '',
}

export default function AdminTripModal({ isOpen, trip, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm)
  const [mainImage, setMainImage] = useState('')
  const [mainImageUrlInput, setMainImageUrlInput] = useState('')
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryUrlInput, setGalleryUrlInput] = useState('')
  
  // Validation séquentielle : une seule erreur active à la fois
  const [activeError, setActiveError] = useState(null) // { field: string, message: string }
  const [globalError, setGlobalError] = useState('')
  const [saving, setSaving] = useState(false)
  const [isDraggingMain, setIsDraggingMain] = useState(false)
  const [isDraggingGallery, setIsDraggingGallery] = useState(false)

  const isEdit = Boolean(trip && trip.id)
  const todayStr = new Date().toISOString().slice(0, 10)

  // Refs pour l'auto-focus et le défilement automatique
  const inputRefs = {
    title: useRef(null),
    destination: useRef(null),
    price: useRef(null),
    totalPlaces: useRef(null),
    mainImage: useRef(null),
    departureDate: useRef(null),
    returnDate: useRef(null),
    galleryImages: useRef(null),
  }

  const mainFileInputRef = useRef(null)
  const galleryFileInputRef = useRef(null)

  // Initialisation et pré-remplissage des champs
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'
    setActiveError(null)
    setGlobalError('')
    setMainImageUrlInput('')
    setGalleryUrlInput('')

    if (trip) {
      // Mode Édition : extraire les données existantes
      const rawProg = trip.program || trip.programme
      const progStr = Array.isArray(rawProg) ? rawProg.join('\n') : rawProg || ''

      const rawImgs = trip.images || []
      const imgList = Array.isArray(rawImgs) && rawImgs.length > 0
        ? rawImgs.map((img) => (typeof img === 'string' ? img : img.url || '')).filter(Boolean)
        : trip.image
        ? [trip.image]
        : []

      const primary = imgList[0] || trip.image || ''
      const additional = imgList.slice(1)

      setForm({
        title: trip.title || trip.titre || '',
        destination: trip.destination?.name || trip.destinationName || trip.destination || '',
        description: trip.description || '',
        departureDate: trip.departureDate
          ? new Date(trip.departureDate).toISOString().slice(0, 10)
          : '',
        returnDate: trip.returnDate
          ? new Date(trip.returnDate).toISOString().slice(0, 10)
          : '',
        price: trip.price ?? trip.prix ?? '',
        totalPlaces: trip.totalPlaces ?? trip.nb_total ?? '',
        program: progStr,
      })
      setMainImage(primary)
      setGalleryImages(additional)
    } else {
      // Mode Création : réinitialiser complètement
      setForm(emptyForm)
      setMainImage('')
      setGalleryImages([])
    }

    const timer = setTimeout(() => {
      inputRefs.title.current?.focus()
    }, 100)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [isOpen, trip])

  // Fermeture par la touche Échap (ESC)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose()
      }
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, saving, onClose])

  if (!isOpen) return null

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === 'departureDate' && updated.returnDate && updated.returnDate < value) {
        updated.returnDate = value
      }
      return updated
    })
    if (activeError?.field === name) {
      setActiveError(null)
    }
  }

  // ---- 1. GESTION DE L'IMAGE PRINCIPALE DE COUVERTURE ----
  function handleSetMainImageUrl() {
    const cleanUrl = mainImageUrlInput.trim()
    if (!cleanUrl) return
    setMainImage(cleanUrl)
    setMainImageUrlInput('')
    if (activeError?.field === 'mainImage') setActiveError(null)
  }

  function handleMainFileInput(e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setMainImage(event.target.result)
        if (activeError?.field === 'mainImage') setActiveError(null)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleMainDrop(e) {
    e.preventDefault()
    setIsDraggingMain(false)
    const file = Array.from(e.dataTransfer.files || []).find((f) => f.type.startsWith('image/'))
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setMainImage(event.target.result)
          if (activeError?.field === 'mainImage') setActiveError(null)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  function handleRemoveMainImage() {
    setMainImage('')
  }

  // ---- 2. GESTION DE LA GALERIE PHOTOS COMPLÉMENTAIRES ----
  function handleAddGalleryUrl() {
    const cleanUrl = galleryUrlInput.trim()
    if (!cleanUrl) return
    setGalleryImages((prev) => [...prev, cleanUrl])
    setGalleryUrlInput('')
    if (activeError?.field === 'galleryImages') setActiveError(null)
  }

  function handleGalleryFileInput(e) {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setGalleryImages((prev) => [...prev, event.target.result])
          if (activeError?.field === 'galleryImages') setActiveError(null)
        }
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function handleGalleryDrop(e) {
    e.preventDefault()
    setIsDraggingGallery(false)
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'))
    if (files.length > 0) {
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            setGalleryImages((prev) => [...prev, event.target.result])
            if (activeError?.field === 'galleryImages') setActiveError(null)
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  function handleRemoveGalleryImage(index) {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index))
  }

  // ---- VALIDATION SÉQUENTIELLE (UNE SEULE ERREUR À LA FOIS) ----
  function validateSequential() {
    // 1. Nom du circuit
    if (!form.title.trim()) {
      return { field: 'title', message: 'À ressaisir : le nom du circuit est obligatoire.' }
    }

    // 2. Destination
    if (!form.destination.trim()) {
      return { field: 'destination', message: 'À ressaisir : la destination est obligatoire.' }
    }

    // 3. Prix
    if (!form.price || Number(form.price) <= 0) {
      return { field: 'price', message: 'À ressaisir : veuillez indiquer un tarif par personne valide (> 0 DT).' }
    }

    // 4. Nombre de places
    if (!form.totalPlaces || Number(form.totalPlaces) <= 0) {
      return { field: 'totalPlaces', message: 'À ressaisir : veuillez indiquer un nombre total de places valide (> 0).' }
    }

    // 5. Image principale de couverture (strictement requise, sans fallback)
    if (!mainImage || !mainImage.trim()) {
      return {
        field: 'mainImage',
        message: "À ressaisir : l'image de couverture principale est obligatoire (importez un fichier ou saisissez une URL).",
      }
    }

    // 6. Date de départ
    if (!form.departureDate) {
      return { field: 'departureDate', message: 'À ressaisir : la date de départ est obligatoire.' }
    }
    if (!isEdit && form.departureDate < todayStr) {
      return { field: 'departureDate', message: "À ressaisir : la date de départ ne peut pas être dans le passé (aujourd'hui ou date future)." }
    }

    // 7. Date de retour
    if (!form.returnDate) {
      return { field: 'returnDate', message: 'À ressaisir : la date de retour est obligatoire.' }
    }
    if (form.departureDate && form.returnDate < form.departureDate) {
      return { field: 'returnDate', message: 'À ressaisir : la date de retour ne peut pas être antérieure à la date de départ.' }
    }

    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGlobalError('')

    const firstError = validateSequential()

    if (firstError) {
      setActiveError(firstError)
      const targetRef = inputRefs[firstError.field]?.current
      if (targetRef) {
        targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' })
        targetRef.focus()
      }
      return
    }

    const cleanGallery = galleryImages.filter((img) => typeof img === 'string' && img.trim().length > 0)
    const combinedImages = [mainImage.trim(), ...cleanGallery]

    const payload = {
      title: form.title.trim(),
      titre: form.title.trim(),
      destination: form.destination.trim(),
      description: form.description,
      image: mainImage.trim(),
      departureDate: form.departureDate,
      date_de_depart: form.departureDate,
      returnDate: form.returnDate,
      date_de_retour: form.returnDate,
      price: Number(form.price),
      prix: Number(form.price),
      totalPlaces: Number(form.totalPlaces),
      nb_total: Number(form.totalPlaces),
      program: form.program.split('\n').map((s) => s.trim()).filter(Boolean),
      images: combinedImages,
    }

    setSaving(true)
    try {
      const result = await onSave(payload, trip?.id)
      setSaving(false)
      if (result && !result.ok) {
        setGlobalError(result.error || "Une erreur est survenue lors de l'enregistrement.")
      }
    } catch (err) {
      setSaving(false)
      setGlobalError(err.message || "Erreur de connexion au serveur.")
    }
  }

  return (
    <div className="admin-trip-modal-overlay" onClick={!saving ? onClose : undefined} role="dialog" aria-modal="true">
      <div className="admin-trip-modal-container ticket" onClick={(e) => e.stopPropagation()}>
        {/* En-tête Fixe / Sticky */}
        <div className="admin-trip-modal-header">
          {!saving && (
            <button
              type="button"
              className="admin-trip-modal-close"
              onClick={onClose}
              aria-label="Fermer la boîte de dialogue"
            >
              ✕
            </button>
          )}

          <div className="admin-trip-modal-stamp">
            <span>✈ {isEdit ? 'Modification Circuit' : 'Nouveau Circuit'}</span>
          </div>
          <h2>{isEdit ? 'Modifier le voyage' : 'Ajouter un nouveau voyage'}</h2>
          <p className="admin-trip-modal-subtitle">
            {isEdit
              ? 'Mettez à jour les informations, tarifs, dates et galerie de ce circuit.'
              : 'Remplissez les détails du voyage. L\'image principale de couverture est obligatoire.'}
          </p>
        </div>

        {/* Formulaire englobant corps défilable et pied fixe */}
        <form className="admin-trip-modal-form" onSubmit={handleSubmit} noValidate>
          {/* Corps Défilable */}
          <div className="admin-trip-modal-body">
            {/* 1. Titre & Destination */}
            <div className="admin-modal-row">
              <div className={`field ${activeError?.field === 'title' ? 'has-field-error' : ''}`}>
                <label htmlFor="modal-trip-title">Nom du circuit *</label>
                <input
                  ref={inputRefs.title}
                  id="modal-trip-title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Ex: Paris Découverte & Musées"
                  aria-invalid={activeError?.field === 'title'}
                />
                {activeError?.field === 'title' && (
                  <span className="field-error-msg" role="alert">
                    ⚠️ {activeError.message}
                  </span>
                )}
              </div>

              <div className={`field ${activeError?.field === 'destination' ? 'has-field-error' : ''}`}>
                <label htmlFor="modal-trip-destination">Destination *</label>
                <input
                  ref={inputRefs.destination}
                  id="modal-trip-destination"
                  name="destination"
                  type="text"
                  value={form.destination}
                  onChange={handleChange}
                  placeholder="Ex: Paris, France ou Madrid, Espagne..."
                  aria-invalid={activeError?.field === 'destination'}
                />
                {activeError?.field === 'destination' && (
                  <span className="field-error-msg" role="alert">
                    ⚠️ {activeError.message}
                  </span>
                )}
              </div>
            </div>

            {/* 2. Description */}
            <div className="field">
              <label htmlFor="modal-trip-desc">Description du circuit</label>
              <textarea
                id="modal-trip-desc"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="Présentation des points forts, hébergement, ambiance du voyage..."
              />
            </div>

            {/* 3. Prix & Places */}
            <div className="admin-modal-row">
              <div className={`field ${activeError?.field === 'price' ? 'has-field-error' : ''}`}>
                <label htmlFor="modal-trip-price">Prix par personne (DT) *</label>
                <input
                  ref={inputRefs.price}
                  id="modal-trip-price"
                  name="price"
                  type="number"
                  min="1"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="500"
                  aria-invalid={activeError?.field === 'price'}
                />
                {activeError?.field === 'price' && (
                  <span className="field-error-msg" role="alert">
                    ⚠️ {activeError.message}
                  </span>
                )}
              </div>

              <div className={`field ${activeError?.field === 'totalPlaces' ? 'has-field-error' : ''}`}>
                <label htmlFor="modal-trip-places">Nombre total de places *</label>
                <input
                  ref={inputRefs.totalPlaces}
                  id="modal-trip-places"
                  name="totalPlaces"
                  type="number"
                  min="1"
                  value={form.totalPlaces}
                  onChange={handleChange}
                  placeholder="25"
                  aria-invalid={activeError?.field === 'totalPlaces'}
                />
                {activeError?.field === 'totalPlaces' && (
                  <span className="field-error-msg" role="alert">
                    ⚠️ {activeError.message}
                  </span>
                )}
              </div>
            </div>

            {/* ===========================================================
                4. IMAGE PRINCIPALE DE COUVERTURE (MODERN REDESIGN)
                =========================================================== */}
            <div
              ref={inputRefs.mainImage}
              tabIndex={-1}
              className={`modern-upload-card ${activeError?.field === 'mainImage' ? 'has-upload-error' : ''}`}
            >
              <div className="modern-upload-header">
                <div className="upload-header-text">
                  <span className="upload-header-title">
                    <span className="upload-title-icon">🖼️</span> Image de couverture principale *
                  </span>
                  <span className="upload-header-sub">
                    Obligatoire — Image haute définition affichée sur la carte et en bannière
                  </span>
                </div>
                {mainImage && <span className="upload-status-badge">✓ Couverture active</span>}
              </div>

              {/* Aperçu en direct si l'image est définie */}
              {mainImage ? (
                <div className="modern-preview-container">
                  <div className="main-cover-preview-card">
                    <img src={mainImage} alt="Couverture principale" className="cover-img-live" />
                    <div className="preview-hover-overlay">
                      <span className="cover-pill-tag">★ Photo de Couverture</span>
                      <button
                        type="button"
                        className="hover-delete-btn"
                        onClick={handleRemoveMainImage}
                        title="Supprimer la photo de couverture"
                        aria-label="Supprimer la photo"
                      >
                        <span className="delete-btn-icon">✕</span>
                        <span className="delete-btn-text">Changer la photo</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Dropzone Stylée + Saisie URL */
                <div className="modern-dropzone-layout">
                  {/* Dropzone Drag & Drop */}
                  <div
                    className={`dropzone-box ${isDraggingMain ? 'is-drag-active' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDraggingMain(true)
                    }}
                    onDragLeave={() => setIsDraggingMain(false)}
                    onDrop={handleMainDrop}
                    onClick={() => mainFileInputRef.current?.click()}
                  >
                    <input
                      ref={mainFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleMainFileInput}
                    />
                    <div className="dropzone-icon-circle">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <span className="dropzone-main-text">Glissez une image ici</span>
                    <span className="dropzone-sub-btn">ou parcourir les fichiers</span>
                  </div>

                  <div className="modern-or-divider">
                    <span>OU</span>
                  </div>

                  {/* Saisie URL */}
                  <div className="url-input-card">
                    <label className="url-label">Coller un lien web</label>
                    <div className="url-input-inline">
                      <span className="url-icon">🔗</span>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/…"
                        value={mainImageUrlInput}
                        onChange={(e) => setMainImageUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSetMainImageUrl()
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-url-add"
                        onClick={handleSetMainImageUrl}
                        disabled={!mainImageUrlInput.trim()}
                      >
                        + Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Message d'erreur séquentiel */}
              {activeError?.field === 'mainImage' && (
                <div className="field-error-msg upload-error-box" role="alert">
                  ⚠️ {activeError.message}
                </div>
              )}
            </div>

            {/* 5. Dates */}
            <div className="admin-modal-row">
              <div className={`field ${activeError?.field === 'departureDate' ? 'has-field-error' : ''}`}>
                <label htmlFor="modal-trip-dep">Date de départ *</label>
                <input
                  ref={inputRefs.departureDate}
                  id="modal-trip-dep"
                  name="departureDate"
                  type="date"
                  min={isEdit ? undefined : todayStr}
                  value={form.departureDate}
                  onChange={handleChange}
                  aria-invalid={activeError?.field === 'departureDate'}
                />
                {activeError?.field === 'departureDate' ? (
                  <span className="field-error-msg" role="alert">
                    ⚠️ {activeError.message}
                  </span>
                ) : (
                  <span className="field-hint">Date de début du séjour</span>
                )}
              </div>

              <div className={`field ${activeError?.field === 'returnDate' ? 'has-field-error' : ''}`}>
                <label htmlFor="modal-trip-ret">Date de retour *</label>
                <input
                  ref={inputRefs.returnDate}
                  id="modal-trip-ret"
                  name="returnDate"
                  type="date"
                  min={form.departureDate || todayStr}
                  value={form.returnDate}
                  onChange={handleChange}
                  aria-invalid={activeError?.field === 'returnDate'}
                />
                {activeError?.field === 'returnDate' ? (
                  <span className="field-error-msg" role="alert">
                    ⚠️ {activeError.message}
                  </span>
                ) : (
                  <span className="field-hint">Postérieure ou égale au départ</span>
                )}
              </div>
            </div>

            {/* 6. Programme */}
            <div className="field">
              <label htmlFor="modal-trip-program">Programme détaillé (une étape par ligne)</label>
              <textarea
                id="modal-trip-program"
                name="program"
                rows={3}
                value={form.program}
                onChange={handleChange}
                placeholder={'Jour 1 : Arrivée et installation\nJour 2 : Visites guidées et monuments\nJour 3 : Journée libre et départ'}
              />
            </div>

            {/* ===========================================================
                7. GALERIE PHOTOS COMPLÉMENTAIRES (MODERN REDESIGN)
                =========================================================== */}
            <div
              ref={inputRefs.galleryImages}
              tabIndex={-1}
              className={`modern-upload-card ${activeError?.field === 'galleryImages' ? 'has-upload-error' : ''}`}
            >
              <div className="modern-upload-header">
                <div className="upload-header-text">
                  <span className="upload-header-title">
                    <span className="upload-title-icon">📸</span> Photos complémentaires / Galerie
                  </span>
                  <span className="upload-header-sub">
                    Optionnel — Photos du séjour visibles dans la galerie détaillée
                  </span>
                </div>
                <span className="upload-counter-tag">
                  {galleryImages.length} photo{galleryImages.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Dropzone + URL pour la Galerie */}
              <div className="modern-dropzone-layout">
                <div
                  className={`dropzone-box ${isDraggingGallery ? 'is-drag-active' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDraggingGallery(true)
                  }}
                  onDragLeave={() => setIsDraggingGallery(false)}
                  onDrop={handleGalleryDrop}
                  onClick={() => galleryFileInputRef.current?.click()}
                >
                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleGalleryFileInput}
                  />
                  <div className="dropzone-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <span className="dropzone-main-text">Déposez plusieurs photos</span>
                  <span className="dropzone-sub-btn">ou parcourir les fichiers</span>
                </div>

                <div className="modern-or-divider">
                  <span>OU</span>
                </div>

                <div className="url-input-card">
                  <label className="url-label">Coller un lien web</label>
                  <div className="url-input-inline">
                    <span className="url-icon">🔗</span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/…"
                      value={galleryUrlInput}
                      onChange={(e) => setGalleryUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddGalleryUrl()
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-url-add"
                      onClick={handleAddGalleryUrl}
                      disabled={!galleryUrlInput.trim()}
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>
              </div>

              {/* Message d'erreur séquentiel si applicable */}
              {activeError?.field === 'galleryImages' && (
                <div className="field-error-msg upload-error-box" role="alert">
                  ⚠️ {activeError.message}
                </div>
              )}

              {/* Grille de Prévisualisation Galerie avec boutons Supprimer au Survol */}
              {galleryImages.length > 0 && (
                <div className="modern-gallery-grid">
                  {galleryImages.map((imgSrc, idx) => (
                    <div key={idx} className="gallery-thumb-card">
                      <img src={imgSrc} alt={`Photo ${idx + 1}`} className="gallery-thumb-img" />
                      <div className="gallery-thumb-overlay">
                        <span className="gallery-index-tag">#{idx + 1}</span>
                        <button
                          type="button"
                          className="gallery-hover-remove-btn"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          title="Supprimer cette photo"
                          aria-label="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Erreur globale du serveur */}
            {globalError && (
              <div className="admin-trip-modal-error" role="alert">
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⚠️</span>
                <div>
                  <strong>Erreur d'enregistrement :</strong>
                  <div>{globalError}</div>
                </div>
              </div>
            )}
          </div>

          {/* Pied Fixe / Sticky */}
          <div className="admin-trip-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? 'Enregistrement en cours…'
                : isEdit
                ? 'Enregistrer les modifications'
                : 'Créer et publier le circuit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
