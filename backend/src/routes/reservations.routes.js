import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { sendReservationConfirmationEmail } from '../lib/mailer.js'
import { validateEmailStrict } from '../lib/emailValidator.js'

const router = Router()

function serializeVoyage(voyage) {
  if (!voyage) return undefined
  const prog = typeof voyage.programme === 'string' ? JSON.parse(voyage.programme) : (voyage.programme || [])
  const imgs = typeof voyage.images === 'string' ? JSON.parse(voyage.images) : (Array.isArray(voyage.images) ? voyage.images : [])
  const firstImg = imgs[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80'
  const destStr = voyage.destination || ''

  return {
    id: voyage.id,
    titre: voyage.titre,
    title: voyage.titre,
    description: voyage.description,
    destination: destStr,
    destinationName: destStr,
    destinationId: destStr,
    date_de_depart: voyage.date_de_depart,
    departureDate: voyage.date_de_depart,
    date_de_retour: voyage.date_de_retour,
    returnDate: voyage.date_de_retour,
    prix: voyage.prix,
    price: voyage.prix,
    nb_total: voyage.nb_total,
    totalPlaces: voyage.nb_total,
    nb_disponible: voyage.nb_disponible,
    availablePlaces: voyage.nb_disponible,
    programme: prog,
    program: prog,
    images: imgs.map((url, i) => ({ id: `${voyage.id}-${i}`, url })),
    image: firstImg,
    statut: voyage.statut,
    status: voyage.statut,
  }
}

function serializeReservation(r) {
  if (!r) return null
  return {
    id: r.id,
    date: r.date,
    reservationDate: r.date,
    statut: r.statut,
    status: r.statut,
    quantite: r.quantite,
    quantity: r.quantite,
    user_id: r.user_id,
    userId: r.user_id,
    voyage_id: r.voyage_id,
    tripId: r.voyage_id,
    trip: serializeVoyage(r.voyage),
    voyage: serializeVoyage(r.voyage),
    payment: r.paiement,
    paiement: r.paiement,
    review: r.avis ? { id: r.avis.id, rating: r.avis.note, comment: r.avis.commentaire } : null,
    avis: r.avis ? { id: r.avis.id, note: r.avis.note, commentaire: r.avis.commentaire } : null,
  }
}

const reservationInclude = {
  voyage: true,
  paiement: true,
  avis: true,
}

// GET /api/reservations/verify — validation par lien email sécurisé
router.get('/verify', async (req, res) => {
  const { token } = req.query
  if (!token) {
    return res.status(400).json({ error: 'Jeton de validation manquant.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_travelplan')
    const { reservationId } = decoded

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: reservationInclude,
    })

    if (!reservation) {
      return res.status(404).json({ error: 'Réservation introuvable.' })
    }

    if (reservation.statut === 'Annulée') {
      return res.status(400).json({ error: 'Cette réservation a été annulée.' })
    }

    if (reservation.statut === 'Confirmée') {
      return res.json({
        ok: true,
        alreadyConfirmed: true,
        reservation: serializeReservation(reservation),
      })
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: { statut: 'Confirmée' },
      include: reservationInclude,
    })

    res.json({
      ok: true,
      alreadyConfirmed: false,
      reservation: serializeReservation(updated),
    })
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Le lien de confirmation a expiré (délai de 48 heures dépassé).' })
    }
    return res.status(400).json({ error: 'Lien de confirmation invalide ou corrompu.' })
  }
})

// POST /api/reservations — le voyageur crée une réservation en statut 'En attente'
router.post('/', authRequired, async (req, res) => {
  const { tripId, voyageId, voyage_id, quantity, quantite } = req.body
  const targetVoyageId = voyage_id || voyageId || tripId
  if (!targetVoyageId) return res.status(400).json({ error: 'Voyage manquant.' })

  const qty = Math.max(Number(quantite) || Number(quantity) || 1, 1)

  const voyage = await prisma.voyage.findUnique({
    where: { id: targetVoyageId },
  })
  if (voyage.statut === 'Annulé') {
    return res.status(400).json({ error: 'Ce voyage a été annulé et ne peut plus être réservé.' })
  }

  if (voyage.date_de_retour && new Date(voyage.date_de_retour) < new Date()) {
    return res.status(400).json({ error: 'Ce voyage est déjà passé et ne peut plus être réservé.' })
  }

  if (voyage.nb_disponible < qty) {
    return res.status(409).json({ error: 'Pas assez de places disponibles.' })
  }

  const already = await prisma.reservation.findFirst({
    where: { user_id: req.user.id, voyage_id: targetVoyageId, statut: { not: 'Annulée' } },
  })
  if (already) return res.status(409).json({ error: 'Vous avez déjà réservé ce voyage.' })

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  const recipientUser = user || req.user
  const recipientEmail = recipientUser?.email

  // Validation stricte de l'adresse email destinataire
  const emailValidation = await validateEmailStrict(recipientEmail)
  if (!emailValidation.isValid) {
    return res.status(400).json({
      error: `Impossible d'enregistrer la réservation et d'envoyer l'e-mail : ${emailValidation.error}`,
      code: emailValidation.code || 'INVALID_EMAIL',
    })
  }

  const [reservation] = await prisma.$transaction([
    prisma.reservation.create({
      data: { user_id: req.user.id, voyage_id: targetVoyageId, quantite: qty, statut: 'En attente' },
      include: reservationInclude,
    }),
    prisma.voyage.update({
      where: { id: targetVoyageId },
      data: { nb_disponible: { decrement: qty } },
    }),
  ])

  const total = voyage.prix * qty
  console.log(`[Reservation POST] 📥 Réservation enregistrée (#${reservation.id}). Envoi de l'email à : ${recipientEmail}...`)

  // Envoi automatique de l'email de confirmation
  const emailResult = await sendReservationConfirmationEmail({
    user: recipientUser,
    trip: serializeVoyage(voyage),
    reservation: { id: reservation.id, quantity: qty },
    total,
  })

  console.log(`[Reservation POST] 📧 Statut envoi email vers ${recipientUser.email} :`, {
    ok: emailResult.ok,
    messageId: emailResult.messageId || null,
    error: emailResult.error || null,
  })

  // Si l'envoi de l'email échoue, on annule la réservation et on retourne une erreur explicite
  if (!emailResult.ok) {
    console.error(`[Reservation POST] ❌ Échec envoi email vers ${recipientUser.email}. Annulation de la réservation #${reservation.id}`)
    
    await prisma.$transaction([
      prisma.reservation.delete({ where: { id: reservation.id } }),
      prisma.voyage.update({
        where: { id: targetVoyageId },
        data: { nb_disponible: { increment: qty } },
      }),
    ])

    return res.status(400).json({
      error: `Adresse email invalide ou introuvable. Échec de l'envoi de l'email : ${emailResult.error || 'Veuillez vérifier votre adresse.'}`,
      code: 'EMAIL_DELIVERY_FAILED',
    })
  }

  res.status(201).json({
    ...serializeReservation(reservation),
    confirmationEmailSent: true,
    confirmationEmailRecipient: recipientUser.email,
    token: emailResult.token,
    verificationLink: emailResult.verificationLink,
    expiresAt: emailResult.expiresAt,
  })
})

// GET /api/reservations/me — page "Mes réservations"
router.get('/me', authRequired, async (req, res) => {
  const reservations = await prisma.reservation.findMany({
    where: { user_id: req.user.id },
    include: reservationInclude,
    orderBy: { date: 'desc' },
  })
  res.json(reservations.map(serializeReservation))
})

// GET /api/reservations/:id — détail d'une réservation
router.get('/:id', authRequired, async (req, res) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: req.params.id },
    include: reservationInclude,
  })
  if (!reservation) return res.status(404).json({ error: 'Réservation introuvable.' })
  if (reservation.user_id !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Action non autorisée.' })
  }
  res.json(serializeReservation(reservation))
})

// PUT /api/reservations/:id/cancel — annulation + libération des places
router.put('/:id/cancel', authRequired, async (req, res) => {
  const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } })
  if (!reservation) return res.status(404).json({ error: 'Réservation introuvable.' })
  if (reservation.user_id !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Action non autorisée.' })
  }
  if (reservation.statut === 'Annulée') {
    const current = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: reservationInclude,
    })
    return res.json(serializeReservation(current))
  }

  const [updated] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id: req.params.id },
      data: { statut: 'Annulée' },
      include: reservationInclude,
    }),
    prisma.voyage.update({
      where: { id: reservation.voyage_id },
      data: { nb_disponible: { increment: reservation.quantite } },
    }),
  ])

  res.json(serializeReservation(updated))
})

export default router