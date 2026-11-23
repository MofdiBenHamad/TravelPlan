import './Pagination.css'

/**
 * Composant de Pagination Minimaliste & Moderne
 *
 * @param {number} currentPage - Page actuelle (1-indexée)
 * @param {number} totalItems - Nombre total d'éléments
 * @param {number} pageSize - Nombre d'éléments par page (par défaut 5)
 * @param {function} onPageChange - Callback déclenché lors du changement de page (newPage)
 * @param {string} itemLabel - Libellé de l'élément (ex: 'voyages', 'participants', 'réservations')
 * @param {object} tableRef - Référence React vers le haut du tableau pour le défilement doux
 */
export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 5,
  onPageChange,
  itemLabel = 'éléments',
  tableRef,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (totalItems <= 0) return null

  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalItems)

  function handlePageSelect(page) {
    if (page === currentPage || page < 1 || page > totalPages) return
    
    onPageChange(page)

    // Défilement fluide vers le haut du tableau ou de la page
    setTimeout(() => {
      if (tableRef?.current) {
        const yOffset = -80 // Marge d'espacement au-dessus du tableau
        const element = tableRef.current
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 50)
  }

  // Génération des numéros de pages avec ellipses
  function getPageNumbers() {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div className="pagination-bar">
      {/* Indicateur de Statut */}
      <div className="pagination-status">
        Affichage de <strong>{startIndex}</strong> à <strong>{endIndex}</strong> sur <strong>{totalItems}</strong> {itemLabel}
        <span className="pagination-page-indicator"> · Page {currentPage} sur {totalPages}</span>
      </div>

      {/* Contrôles de Navigation */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          {/* Bouton Précédent */}
          <button
            type="button"
            className="pagination-btn pagination-prev"
            onClick={() => handlePageSelect(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Page précédente"
          >
            ‹ Précédent
          </button>

          {/* Numéros de Pages */}
          <div className="pagination-numbers">
            {getPageNumbers().map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  type="button"
                  className={`pagination-num ${p === currentPage ? 'is-active' : ''}`}
                  onClick={() => handlePageSelect(p)}
                  aria-current={p === currentPage ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Bouton Suivant */}
          <button
            type="button"
            className="pagination-btn pagination-next"
            onClick={() => handlePageSelect(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Page suivante"
          >
            Suivant ›
          </button>
        </div>
      )}
    </div>
  )
}
