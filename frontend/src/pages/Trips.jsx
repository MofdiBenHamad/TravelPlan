import { useMemo, useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import TripCard from '../components/TripCard.jsx'
import Pagination from '../components/Pagination.jsx'
import './Trips.css'

export default function Trips() {
  const { trips, destinations } = useApp()
  const [selectedDestId, setSelectedDestId] = useState('all')
  const [query, setQuery] = useState('')

  // Pagination (5 voyages par page par défaut)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const gridRef = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return trips.filter((t) => {
      const destName = (t.destination?.name || t.destinationName || '').toLowerCase()
      const title = t.title.toLowerCase()
      const desc = (t.description || '').toLowerCase()
      const matchesQuery = !q || title.includes(q) || destName.includes(q) || desc.includes(q)
      const matchesDest = selectedDestId === 'all' || t.destinationId === selectedDestId
      return matchesQuery && matchesDest
    })
  }, [trips, query, selectedDestId])

  // Réinitialise la pagination à la page 1 si les filtres changent
  useEffect(() => {
    setCurrentPage(1)
  }, [query, selectedDestId])

  // Découpage paginé (5 éléments par page)
  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  return (
    <section className="section">
      <div className="container">
        <div className="trips-head">
          <div>
            <span className="eyebrow">Circuits & Séjours</span>
            <h1>Explorez nos voyages par destination</h1>
            <p className="trips-subtitle">
              Chaque destination propose plusieurs circuits uniques adaptés à vos envies.
            </p>
          </div>
          <div className="trips-search">
            <input
              type="text"
              placeholder="Rechercher une destination, un circuit…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Rechercher un voyage"
            />
          </div>
        </div>

        {/* Filtres par Destination */}
        <div className="destinations-filter-bar">
          <button
            type="button"
            className={`dest-chip ${selectedDestId === 'all' ? 'is-active' : ''}`}
            onClick={() => setSelectedDestId('all')}
          >
            Toutes les destinations ({trips.length})
          </button>
          {destinations.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`dest-chip ${selectedDestId === d.id ? 'is-active' : ''}`}
              onClick={() => setSelectedDestId(d.id)}
            >
              📍 {d.name} ({d.tripsCount || d.trips?.length || 0})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state ticket" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p>Aucun circuit trouvé pour votre recherche.</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setQuery('')
                setSelectedDestId('all')
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div ref={gridRef} className="trip-grid">
              {paginatedTrips.map((t) => (
                <TripCard key={t.id} trip={t} />
              ))}
            </div>

            {/* Pagination Publique des Voyages (5 par page) */}
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                itemLabel="voyages"
                tableRef={gridRef}
              />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
