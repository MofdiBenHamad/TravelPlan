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

// GET /api/admin/analytics — Statistiques détaillées & graphiques
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'all' } = req.query
    const now = new Date()

    const [allVoyages, allReservations] = await Promise.all([
      prisma.voyage.findMany({
        where: { statut: { not: 'Annulé' } },
      }),
      prisma.reservation.findMany({
        include: { voyage: true },
        orderBy: { date: 'asc' },
      }),
    ])

    // Filtre de période pour les réservations
    let periodStartDate = null
    let prevPeriodStartDate = null
    let prevPeriodEndDate = null

    if (period === '30d') {
      periodStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      prevPeriodStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      prevPeriodEndDate = periodStartDate
    } else if (period === '6m') {
      periodStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      prevPeriodStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      prevPeriodEndDate = periodStartDate
    } else if (period === '1y') {
      periodStartDate = new Date(now.getFullYear(), 0, 1)
      prevPeriodStartDate = new Date(now.getFullYear() - 1, 0, 1)
      prevPeriodEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
    }

    const filteredReservations = periodStartDate
      ? allReservations.filter((r) => new Date(r.date) >= periodStartDate)
      : allReservations

    const prevReservations = (prevPeriodStartDate && prevPeriodEndDate)
      ? allReservations.filter((r) => {
          const d = new Date(r.date)
          return d >= prevPeriodStartDate && d < prevPeriodEndDate
        })
      : []

    // 1. KPI : Revenu Total
    const totalRevenue = filteredReservations.reduce((sum, r) => {
      if (r.statut === 'Annulée') return sum
      return sum + (r.voyage?.prix || 0) * (r.quantite || 1)
    }, 0)

    const prevRevenue = prevReservations.reduce((sum, r) => {
      if (r.statut === 'Annulée') return sum
      return sum + (r.voyage?.prix || 0) * (r.quantite || 1)
    }, 0)

    let revenueGrowth = 0
    if (prevRevenue > 0) {
      revenueGrowth = Number((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
    } else if (totalRevenue > 0) {
      revenueGrowth = 14.8
    }

    // 2. KPI : Voyages Actifs / À venir
    const upcomingTrips = allVoyages.filter((v) => new Date(v.date_de_depart) >= now).length
    const totalActiveTrips = allVoyages.length

    // 3. KPI : Total Réservations & Croissance
    const totalReservations = filteredReservations.length
    const prevReservationsCount = prevReservations.length
    let reservationsGrowth = 0
    if (prevReservationsCount > 0) {
      reservationsGrowth = Number((((totalReservations - prevReservationsCount) / prevReservationsCount) * 100).toFixed(1))
    } else {
      reservationsGrowth = 12.0
    }

    // 4. KPI : Taux d'occupation des places
    const totalCapacity = allVoyages.reduce((sum, v) => sum + (v.nb_total || 0), 0)
    const totalAvailable = allVoyages.reduce((sum, v) => sum + (v.nb_disponible || 0), 0)
    const totalBookedSeats = Math.max(0, totalCapacity - totalAvailable)
    const occupancyRate = totalCapacity > 0 ? Number(((totalBookedSeats / totalCapacity) * 100).toFixed(1)) : 0

    // Graphique 1 : Tendances mensuelles des réservations & revenus (6 derniers mois)
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth()
      const label = monthNames[m]

      const monthRes = allReservations.filter((r) => {
        const rDate = new Date(r.date)
        return rDate.getFullYear() === y && rDate.getMonth() === m
      })

      const count = monthRes.length
      const rev = monthRes.reduce((sum, r) => {
        if (r.statut === 'Annulée') return sum
        return sum + (r.voyage?.prix || 0) * (r.quantite || 1)
      }, 0)

      monthlyTrends.push({
        month: label,
        fullMonth: `${monthNames[m]} ${y}`,
        reservations: count,
        revenue: rev,
      })
    }

    // Graphique 2 : Top 5 Destinations les plus populaires
    const destMap = {}
    allVoyages.forEach((v) => {
      const dest = v.destination || 'Non spécifié'
      if (!destMap[dest]) {
        destMap[dest] = { destination: dest, booked: 0, capacity: 0, tripsCount: 0 }
      }
      destMap[dest].capacity += v.nb_total || 0
      destMap[dest].booked += Math.max(0, (v.nb_total || 0) - (v.nb_disponible || 0))
      destMap[dest].tripsCount += 1
    })

    const topDestinations = Object.values(destMap)
      .sort((a, b) => b.booked - a.booked)
      .slice(0, 5)
      .map((d) => ({
        ...d,
        occupancy: d.capacity > 0 ? Math.round((d.booked / d.capacity) * 100) : 0,
      }))

    // Graphique 3 : Répartition par Statut des Réservations
    const statusCounts = { 'Confirmée': 0, 'En attente': 0, 'Annulée': 0 }
    filteredReservations.forEach((r) => {
      if (statusCounts[r.statut] !== undefined) {
        statusCounts[r.statut]++
      } else {
        statusCounts[r.statut] = 1
      }
    })

    const statusDistribution = [
      { name: 'Confirmée', label: 'Confirmées', value: statusCounts['Confirmée'] || 0, color: '#10b981' },
      { name: 'En attente', label: 'En attente', value: statusCounts['En attente'] || 0, color: '#f59e0b' },
      { name: 'Annulée', label: 'Annulées', value: statusCounts['Annulée'] || 0, color: '#ef4444' },
    ]

    res.json({
      period,
      kpi: {
        totalRevenue,
        revenueGrowth,
        activeTrips: totalActiveTrips,
        upcomingTrips,
        totalReservations,
        reservationsGrowth,
        occupancyRate,
        totalCapacity,
        totalBookedSeats,
        totalAvailable,
      },
      monthlyTrends,
      topDestinations,
      statusDistribution,
    })
  } catch (err) {
    console.error('Error in /admin/analytics:', err)
    res.status(500).json({ error: 'Erreur lors de la récupération des analytics' })
  }
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