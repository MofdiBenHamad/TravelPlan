import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired, adminOnly } from '../middleware/auth.js'
import { sendTripCancellationEmail } from '../lib/mailer.js'

const router = Router()

function serializeVoyage(voyage) {
  if (!voyage) return null
  const prog = typeof voyage.programme === 'string' ? JSON.parse(voyage.programme) : (voyage.programme || [])
  const imgs = typeof voyage.images === 'string' ? JSON.parse(voyage.images) : (Array.isArray(voyage.images) ? voyage.images : [])
  const firstImg = imgs[0] || ''
  const destStr = voyage.destination || ''

  const now = new Date()
  const returnDate = voyage.date_de_retour ? new Date(voyage.date_de_retour) : null
  const isPast = returnDate ? returnDate < now : false

  let computedStatut = voyage.statut
  if (computedStatut !== 'Annulé' && isPast) {
    computedStatut = 'Passé'
  }

  return {
    id: voyage.id,
    titre: voyage.titre,
    title: voyage.titre,
    description: voyage.description,
    destination: destStr,
    destinationName: destStr,
    destinationId: destStr,
    departureDate: voyage.date_de_depart,
    date_de_depart: voyage.date_de_depart,
    returnDate: voyage.date_de_retour,
    date_de_retour: voyage.date_de_retour,
    price: voyage.prix,
    prix: voyage.prix,
    totalPlaces: voyage.nb_total,
    nb_total: voyage.nb_total,
    availablePlaces: voyage.nb_disponible,
    nb_disponible: voyage.nb_disponible,
    programme: prog,
    program: prog,
    images: imgs.map((url, i) => ({ id: `${voyage.id}-${i}`, url })),
    image: firstImg,
    statut: computedStatut,
    status: computedStatut,
    isPast,
  }
}

function validateVoyageDates(departureDate, returnDate) {
  if (!departureDate) return 'La date de départ est obligatoire.'
  if (!returnDate) return 'La date de retour est obligatoire.'

  const dep = new Date(departureDate)
  const ret = new Date(returnDate)

  if (isNaN(dep.getTime())) return 'La date de départ est invalide.'
  if (isNaN(ret.getTime())) return 'La date de retour est invalide.'

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const depStart = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate()).getTime()
  const retStart = new Date(ret.getFullYear(), ret.getMonth(), ret.getDate()).getTime()

  if (depStart < todayStart) {
    return "La date de départ ne peut pas être dans le passé (elle doit être aujourd'hui ou une date future)."
  }

  if (retStart < depStart) {
    return 'La date de retour ne peut pas être antérieure à la date de départ.'
  }

  return null
}

// GET /api/trips — consultation publique des voyages
router.get('/', async (req, res) => {
  const { destination, destinationId, includeCanceled } = req.query
  const destFilter = destination || destinationId

  const where = {
    ...(destFilter ? { destination: { equals: destFilter, mode: 'insensitive' } } : {}),
    ...(includeCanceled === 'true' ? {} : { statut: { not: 'Annulé' } }),
  }

  const voyages = await prisma.voyage.findMany({
    where,
    orderBy: { date_de_depart: 'asc' },
  })
  res.json(voyages.map(serializeVoyage))
})

// GET /api/trips/:id — détail d'un voyage
router.get('/:id', async (req, res) => {
  const voyage = await prisma.voyage.findUnique({
    where: { id: req.params.id },
    include: {
      avis: {
        where: { publie: true },
        include: { user: true },
        orderBy: { id: 'desc' },
      },
    },
  })
  if (!voyage) return res.status(404).json({ error: "Ce voyage n'existe pas." })
  res.json(serializeVoyage(voyage))
})

// POST /api/trips — ADMIN uniquement
router.post('/', authRequired, adminOnly, async (req, res) => {
  const {
    title,
    titre,
    destination,
    destinationName,
    destinationId,
    description,
    image,
    departureDate,
    date_de_depart,
    returnDate,
    date_de_retour,
    price,
    prix,
    totalPlaces,
    nb_total,
    program,
    programme,
    images,
  } = req.body

  const voyageTitre = (titre || title || '').trim()
  const destInput = (destination || destinationName || destinationId || '').trim()
  const depDate = date_de_depart || departureDate
  const retDate = date_de_retour || returnDate
  const voyagePrix = prix !== undefined ? Number(prix) : Number(price)
  const voyagePlaces = nb_total !== undefined ? Number(nb_total) : Number(totalPlaces)

  const imagesList = Array.isArray(images)
    ? images.map(i => (typeof i === 'string' ? i.trim() : (i?.url || '').trim())).filter(Boolean)
    : typeof images === 'string' && images.trim()
    ? [images.trim()]
    : image && image.trim()
    ? [image.trim()]
    : []

  if (!voyageTitre || !destInput || !depDate || !retDate || !voyagePrix || !voyagePlaces || imagesList.length === 0) {
    return res.status(400).json({ error: 'Champs obligatoires manquants. Au moins une photo valide est requise.' })
  }

  const dateError = validateVoyageDates(depDate, retDate)
  if (dateError) {
    return res.status(400).json({ error: dateError })
  }

  const rawProg = programme || program
  const parsedProgram = Array.isArray(rawProg)
    ? rawProg
    : typeof rawProg === 'string'
    ? rawProg.split('\n').map((s) => s.trim()).filter(Boolean)
    : []

  const voyage = await prisma.voyage.create({
    data: {
      destination: destInput,
      titre: voyageTitre,
      description: description || '',
      date_de_depart: new Date(depDate),
      date_de_retour: new Date(retDate),
      prix: voyagePrix,
      nb_total: voyagePlaces,
      nb_disponible: voyagePlaces,
      programme: JSON.stringify(parsedProgram),
      images: JSON.stringify(imagesList),
      statut: 'ACTIVE',
    },
  })

  res.status(201).json(serializeVoyage(voyage))
})

// PUT /api/trips/:id — ADMIN uniquement
router.put('/:id', authRequired, adminOnly, async (req, res) => {
  const existing = await prisma.voyage.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: "Ce voyage n'existe pas." })

  const {
    title,
    titre,
    destination,
    destinationName,
    destinationId,
    description,
    image,
    departureDate,
    date_de_depart,
    returnDate,
    date_de_retour,
    price,
    prix,
    totalPlaces,
    nb_total,
    program,
    programme,
    images,
  } = req.body

  const depDateToCheck = date_de_depart || departureDate || existing.date_de_depart
  const retDateToCheck = date_de_retour || returnDate || existing.date_de_retour

  const dateError = validateVoyageDates(depDateToCheck, retDateToCheck)
  if (dateError) {
    return res.status(400).json({ error: dateError })
  }

  const destInput = (destination || destinationName || destinationId || '').trim()
  const alreadyBooked = existing.nb_total - existing.nb_disponible
  const newTotal = (nb_total !== undefined ? Number(nb_total) : totalPlaces !== undefined ? Number(totalPlaces) : existing.nb_total)
  const newPrix = prix !== undefined ? Number(prix) : price !== undefined ? Number(price) : existing.prix

  const rawProg = programme !== undefined ? programme : program
  const parsedProgram = rawProg !== undefined
    ? (Array.isArray(rawProg) ? rawProg : typeof rawProg === 'string' ? rawProg.split('\n').map((s) => s.trim()).filter(Boolean) : [])
    : undefined

  let updatedImages = undefined
  if (Array.isArray(images)) {
    const list = images.map(i => (typeof i === 'string' ? i.trim() : (i?.url || '').trim())).filter(Boolean)
    if (list.length === 0) {
      return res.status(400).json({ error: 'Au moins une photo valide est requise.' })
    }
    updatedImages = JSON.stringify(list)
  } else if (image && !images) {
    if (!image.trim()) {
      return res.status(400).json({ error: 'Au moins une photo valide est requise.' })
    }
    updatedImages = JSON.stringify([image.trim()])
  }

  const voyage = await prisma.voyage.update({
    where: { id: req.params.id },
    data: {
      destination: destInput || existing.destination,
      titre: (titre || title) ? (titre || title).trim() : existing.titre,
      description: description !== undefined ? description : existing.description,
      date_de_depart: (date_de_depart || departureDate) ? new Date(date_de_depart || departureDate) : existing.date_de_depart,
      date_de_retour: (date_de_retour || returnDate) ? new Date(date_de_retour || returnDate) : existing.date_de_retour,
      prix: newPrix,
      nb_total: newTotal,
      nb_disponible: Math.max(newTotal - alreadyBooked, 0),
      ...(parsedProgram !== undefined ? { programme: JSON.stringify(parsedProgram) } : {}),
      ...(updatedImages !== undefined ? { images: updatedImages } : {}),
    },
  })

  res.json(serializeVoyage(voyage))
})

// PUT /api/trips/:id/cancel — ADMIN uniquement : annulation et notification par email
router.put('/:id/cancel', authRequired, adminOnly, async (req, res) => {
  const tripId = req.params.id
  const voyage = await prisma.voyage.findUnique({
    where: { id: tripId },
  })
  if (!voyage) return res.status(404).json({ error: "Ce voyage n'existe pas." })

  // 1. Mettre à jour le statut du voyage à 'Annulé' et places disponibles à 0
  await prisma.voyage.update({
    where: { id: tripId },
    data: { statut: 'Annulé', nb_disponible: 0 },
  })

  // 2. Trouver toutes les réservations actives pour ce voyage
  const activeReservations = await prisma.reservation.findMany({
    where: {
      voyage_id: tripId,
      statut: { not: 'Annulée' },
    },
    include: {
      user: true,
      voyage: true,
    },
  })

  // 3. Basculer le statut de toutes ces réservations à 'Annulée'
  if (activeReservations.length > 0) {
    await prisma.reservation.updateMany({
      where: {
        voyage_id: tripId,
        statut: { not: 'Annulée' },
      },
      data: { statut: 'Annulée' },
    })

    // 4. Envoi asynchrone des emails de notification d'annulation
    activeReservations.forEach((reservation) => {
      if (reservation.user && reservation.user.email) {
        sendTripCancellationEmail({
          user: reservation.user,
          trip: reservation.voyage || voyage,
          reservation,
        }).catch((err) => {
          console.error(`[Mailer Async] Erreur envoi annulation à ${reservation.user.email} :`, err)
        })
      }
    })
  }

  console.log(`[Admin Trip Cancel] 🛑 Voyage "${voyage.titre}" (#${voyage.id}) annulé. ${activeReservations.length} voyageur(s) notifié(s).`)

  res.json({
    ok: true,
    message: `Le voyage a été annulé avec succès. ${activeReservations.length} voyageur(s) ont été notifiés par email.`,
    notifiedCount: activeReservations.length,
  })
})

// DELETE /api/trips/:id — ADMIN uniquement : annulation sécurisée et retrait du catalogue
router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  const tripId = req.params.id
  const voyage = await prisma.voyage.findUnique({
    where: { id: tripId },
  })
  if (!voyage) return res.status(404).json({ error: "Ce voyage n'existe pas." })

  const activeReservations = await prisma.reservation.findMany({
    where: {
      voyage_id: tripId,
      statut: { not: 'Annulée' },
    },
    include: {
      user: true,
      voyage: true,
    },
  })

  if (activeReservations.length > 0) {
    await prisma.reservation.updateMany({
      where: { voyage_id: tripId, statut: { not: 'Annulée' } },
      data: { statut: 'Annulée' },
    })

    activeReservations.forEach((reservation) => {
      if (reservation.user && reservation.user.email) {
        sendTripCancellationEmail({
          user: reservation.user,
          trip: reservation.voyage || voyage,
          reservation,
        }).catch((err) => {
          console.error(`[Mailer Async] Erreur envoi annulation à ${reservation.user.email} :`, err)
        })
      }
    })
  }

  await prisma.voyage.update({
    where: { id: tripId },
    data: { statut: 'Annulé', nb_disponible: 0 },
  })

  console.log(`[Admin Trip Delete] 🛑 Voyage "${voyage.titre}" (#${voyage.id}) annulé et retiré du catalogue. ${activeReservations.length} voyageur(s) notifié(s).`)

  res.json({
    ok: true,
    message: `Le voyage a été annulé et retiré de la vente. ${activeReservations.length} voyageur(s) notifié(s).`,
    notifiedCount: activeReservations.length,
  })
})

export default router