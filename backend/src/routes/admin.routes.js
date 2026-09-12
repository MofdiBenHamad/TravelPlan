import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired, adminOnly } from '../middleware/auth.js'

const router = Router()
router.use(authRequired, adminOnly)

function toPublicUser(user) {
  if (!user) return null
  const { password, ...rest } = user
  return {
    ...rest,
    firstName: user.prenom,
    lastName: user.nom,
    prenom: user.prenom,
    nom: user.nom,
  }
}

// GET /api/admin/stats — tableau de bord
router.get('/stats', async (req, res) => {
  const [activeVoyages, activeReservationsList, travelersCount, allVoyages] = await Promise.all([
    prisma.voyage.findMany({ where: { statut: { not: 'Annulé' } }, select: { destination: true } }),
    prisma.reservation.findMany({
      where: { statut: { not: 'Annulée' } },
      include: { voyage: true },
    }),
    prisma.user.count({ where: { role: 'VOYAGEUR' } }),
    prisma.voyage.findMany({ select: { nb_disponible: true } }),
  ])

  const destinationsCount = new Set(activeVoyages.map((v) => v.destination)).size
  const availablePlaces = allVoyages.reduce((sum, v) => sum + v.nb_disponible, 0)
  const revenue = activeReservationsList.reduce((sum, r) => {
    return sum + (r.voyage?.prix || 0) * (r.quantite || 1)
  }, 0)

  res.json({
    destinationsCount,
    tripsCount: activeVoyages.length,
    voyagesCount: activeVoyages.length,
    reservationsCount: activeReservationsList.length,
    travelersCount,
    availablePlaces,
    revenue,
  })
})

// GET /api/admin/participants?tripId=... — participants aux voyages
router.get('/participants', async (req, res) => {
  const { tripId, voyageId } = req.query
  const targetId = voyageId || tripId

  const reservations = await prisma.reservation.findMany({
    where: {
      statut: { not: 'Annulée' },
      ...(targetId ? { voyage_id: targetId } : {}),
    },
    include: { user: true, voyage: true },
    orderBy: { date: 'desc' },
  })

  res.json(
    reservations.map((r) => {
      const unitPrice = r.voyage?.prix || 0
      const totalAmount = unitPrice * (r.quantite || 1)
      return {
        id: r.id,
        status: r.statut,
        statut: r.statut,
        quantity: r.quantite,
        quantite: r.quantite,
        user: toPublicUser(r.user),
        trip: {
          id: r.voyage.id,
          title: r.voyage.titre,
          titre: r.voyage.titre,
          price: r.voyage.prix,
          prix: r.voyage.prix,
          destination: r.voyage.destination || '',
        },
        amount: totalAmount,
        confirmationEmailRecipient: r.user.email,
      }
    })
  )
})

// GET /api/admin/reservations — toutes les réservations
router.get('/reservations', async (req, res) => {
  const reservations = await prisma.reservation.findMany({
    include: { user: true, voyage: true },
    orderBy: { date: 'desc' },
  })

  res.json(
    reservations.map((r) => {
      const unitPrice = r.voyage?.prix || 0
      const totalAmount = unitPrice * (r.quantite || 1)
      return {
        id: r.id,
        status: r.statut,
        statut: r.statut,
        quantity: r.quantite,
        quantite: r.quantite,
        reservationDate: r.date,
        date: r.date,
        user: toPublicUser(r.user),
        trip: {
          id: r.voyage.id,
          title: r.voyage.titre,
          titre: r.voyage.titre,
          price: r.voyage.prix,
          prix: r.voyage.prix,
          destination: r.voyage.destination || '',
        },
        amount: totalAmount,
        confirmationEmailRecipient: r.user.email,
      }
    })
  )
})

// GET /api/admin/messages — formulaire contact
router.get('/messages', async (req, res) => {
  const messages = await prisma.message.findMany({ orderBy: { id: 'desc' } })
  res.json(
    messages.map((m) => ({
      id: m.id,
      name: m.nom,
      nom: m.nom,
      email: m.email,
      subject: m.sujet,
      sujet: m.sujet,
      message: m.message,
    }))
  )
})

// GET /api/admin/reviews — tous les avis
router.get('/reviews', async (req, res) => {
  const avisList = await prisma.avis.findMany({
    include: { user: true, voyage: true },
    orderBy: { id: 'desc' },
  })

  res.json(
    avisList.map((r) => ({
      id: r.id,
      rating: r.note,
      note: r.note,
      comment: r.commentaire,
      commentaire: r.commentaire,
      published: r.publie,
      publie: r.publie,
      user: toPublicUser(r.user),
      trip: {
        id: r.voyage.id,
        title: r.voyage.titre,
        titre: r.voyage.titre,
        destination: r.voyage.destination || '',
      },
    }))
  )
})

// PUT /api/admin/reviews/:id/publish — afficher/masquer un avis
router.put('/reviews/:id/publish', async (req, res) => {
  const { published, publie } = req.body
  const isPublie = publie !== undefined ? Boolean(publie) : Boolean(published)

  const updatedAvis = await prisma.avis.update({
    where: { id: req.params.id },
    data: { publie: isPublie },
  })
  res.json({
    id: updatedAvis.id,
    rating: updatedAvis.note,
    comment: updatedAvis.commentaire,
    published: updatedAvis.publie,
    publie: updatedAvis.publie,
  })
})

export default router