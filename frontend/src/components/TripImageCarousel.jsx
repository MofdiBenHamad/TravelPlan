import { useState, useEffect, useRef, useCallback } from 'react'
import './TripImageCarousel.css'

export default function TripImageCarousel({ images = [], title = 'Voyage' }) {
  // Garantir au moins une image de fallback
  const slideList = images.length > 0 ? images : ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80']
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)

  // Transition vers la diapositive suivante
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slideList.length)
  }, [slideList.length])

  // Transition vers la diapositive précédente
  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slideList.length) % slideList.length)
  }, [slideList.length])

  // Gestion du défilement automatique toutes les 3 secondes (3000ms)
  useEffect(() => {
    if (slideList.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      nextSlide()
    }, 3000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [slideList.length, isPaused, nextSlide, currentIndex])

  // Réinitialiser l'index si les images changent (ex: changement de circuit)
  useEffect(() => {
    setCurrentIndex(0)
  }, [images])

  function handleSelect(index) {
    setCurrentIndex(index)
  }

  return (
    <div
      className="trip-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label={`Galerie photos pour ${title}`}
    >
      {/* Cadre principal du carrousel */}
      <div className="trip-carousel-viewport">
        {slideList.map((imgUrl, index) => {
          const isActive = index === currentIndex
          return (
            <div
              key={index}
              className={`trip-carousel-slide ${isActive ? 'is-active' : ''}`}
              aria-hidden={!isActive}
            >
              <img
                src={imgUrl}
                alt={`${title} - Photo ${index + 1}`}
                className="trip-carousel-img"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          )
        })}

        {/* Badge compteur de photos & indicateur de pause */}
        <div className="trip-carousel-badge">
          <span>📷 {currentIndex + 1} / {slideList.length}</span>
          {isPaused && <span className="trip-carousel-paused-tag">⏸ En pause</span>}
        </div>

        {/* Flèches de navigation manuelle (si plusieurs images) */}
        {slideList.length > 1 && (
          <>
            <button
              type="button"
              className="trip-carousel-btn trip-carousel-btn-prev"
              onClick={prevSlide}
              aria-label="Image précédente"
            >
              ‹
            </button>
            <button
              type="button"
              className="trip-carousel-btn trip-carousel-btn-next"
              onClick={nextSlide}
              aria-label="Image suivante"
            >
              ›
            </button>

            {/* Puces / Indicateurs circulaires en bas de l'image */}
            <div className="trip-carousel-dots">
              {slideList.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`trip-carousel-dot ${i === currentIndex ? 'is-active' : ''}`}
                  onClick={() => handleSelect(i)}
                  aria-label={`Aller à la photo ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Miniatures interactives sous l'image principale */}
      {slideList.length > 1 && (
        <div className="trip-carousel-thumbs">
          {slideList.map((thumbUrl, i) => (
            <button
              key={i}
              type="button"
              className={`trip-carousel-thumb ${i === currentIndex ? 'is-active' : ''}`}
              onClick={() => handleSelect(i)}
              aria-label={`Afficher la miniature ${i + 1}`}
            >
              <img src={thumbUrl} alt={`Miniature ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
