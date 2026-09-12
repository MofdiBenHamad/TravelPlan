import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// GET /api/reviews/published — avis affichés publiquement (page d'accueil)
router.get('/published', async (req, res) => {
  const avisList = await prisma.avis.findMany({
    where: { publie: true },
    include: { user: true, voyage: true },
    orderBy: { id: 'desc' },
    take: 12,
  })

  res.json(
    avisList.map((r) => ({
      id: r.id,
      rating: r.note,
      note: r.note,
      comment: r.commentaire,
      commentaire: r.commentaire,
      traveler: `${r.user.prenom} ${r.user.nom ? r.user.nom.charAt(0) + '.' : ''}`,
      tripTitle: r.voyage?.titre || 'Circuit TravelPlan',
      voyageTitre: r.voyage?.titre || 'Circuit TravelPlan',
    }))
  )
})

// POST /api/reviews — le voyageur laisse un avis pour un séjour terminé
router.post('/', authRequired, async (req, res) => {
  const { reservationId, rating, note, comment, commentaire } = req.body
  const avisRating = note !== undefined ? Number(note) : Number(rating)
  const avisComment = (commentaire || comment || '').trim()

  if (!reservationId || !avisRating || !avisComment) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs.' })
  }
  if (avisRating < 1 || avisRating > 5) {
    return res.status(400).json({ error: 'La note doit être comprise entre 1 et 5.' })
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { voyage: true, avis: true },
  })

  if (!reservation) {
    return res.status(404).json({ error: 'Réservation introuvable.' })
  }
  if (reservation.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Action non autorisée.' })
  }
  if (reservation.statut !== 'Confirmée') {
    return res.status(409).json({ error: 'Vous devez avoir une réservation confirmée pour laisser un avis.' })
  }
  if (reservation.avis) {
    return res.status(409).json({ error: 'Vous avez déjà laissé un avis pour cette réservation.' })
  }

  // Règle d'achèvement du voyage : La date de retour doit être passée
  const returnDate = new Date(reservation.voyage.date_de_retour)
  const now = new Date()
  if (now < returnDate) {
    return res.status(400).json({
      error: `Vous ne pouvez donner un avis qu'une fois le voyage terminé (après le ${returnDate.toLocaleDateString('fr-FR')}).`,
    })
  }

  const avis = await prisma.avis.create({
    data: {
      user_id: req.user.id,
      voyage_id: reservation.voyage_id,
      reservation_id: reservationId,
      note: avisRating,
      commentaire: avisComment,
      publie: false, // Nécessite validation par l'admin pour affichage sur l'accueil
    },
  })

  res.status(201).json({
    id: avis.id,
    rating: avis.note,
    note: avis.note,
    comment: avis.commentaire,
    commentaire: avis.commentaire,
    published: avis.publie,
    publie: avis.publie,
    userId: avis.user_id,
    voyageId: avis.voyage_id,
    reservationId: avis.reservation_id,
  })
})

export default router