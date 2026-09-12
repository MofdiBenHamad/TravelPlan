import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired, adminOnly } from '../middleware/auth.js'

const router = Router()

function serializeVoyage(voyage) {
  if (!voyage) return null
  const prog = typeof voyage.programme === 'string' ? JSON.parse(voyage.programme) : (voyage.programme || [])
  const imgs = typeof voyage.images === 'string' ? JSON.parse(voyage.images) : (Array.isArray(voyage.images) ? voyage.images : [])
  const firstImg = imgs[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80'
  
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
    destination: voyage.destination,
    destinationName: voyage.destination,
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
    program: prog,
    programme: prog,
    images: imgs.map((url, i) => ({ id: `${voyage.id}-${i}`, url })),
    image: firstImg,
    status: computedStatut,
    statut: computedStatut,
    isPast,
  }
}

function buildDestinationObject(destName, rawVoyages) {
  const voyages = rawVoyages.map(serializeVoyage)
  const minPrice = voyages.length ? Math.min(...voyages.map((v) => v.prix)) : 0
  const firstImage = voyages[0]?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80'
  const pays = destName.includes(',') ? destName.split(',')[1].trim() : ''

  return {
    id: destName,
    name: destName,
    nom: destName,
    country: pays,
    pays,
    description: voyages[0]?.description || '',
    image: firstImage,
    tripsCount: voyages.length,
    voyagesCount: voyages.length,
    minPrice,
    trips: voyages,
    voyages,
  }
}

// GET /api/destinations — consultation publique des destinations groupées depuis la table voyage
router.get('/', async (req, res) => {
  const allVoyages = await prisma.voyage.findMany({
    where: { statut: { not: 'Annulé' } },
    orderBy: { date_de_depart: 'asc' },
  })

  // Regroupement par nom de destination
  const grouped = new Map()
  for (const v of allVoyages) {
    const destName = (v.destination || '').trim() || 'Autre'
    if (!grouped.has(destName)) {
      grouped.set(destName, [])
    }
    grouped.get(destName).push(v)
  }

  const destinations = Array.from(grouped.entries()).map(([destName, list]) =>
    buildDestinationObject(destName, list)
  )

  res.json(destinations)
})

// GET /api/destinations/:id — détail d'une destination et de ses circuits
router.get('/:id', async (req, res) => {
  const param = decodeURIComponent(req.params.id).trim()

  const voyages = await prisma.voyage.findMany({
    where: {
      destination: { equals: param, mode: 'insensitive' },
      statut: { not: 'Annulé' },
    },
    orderBy: { date_de_depart: 'asc' },
  })

  if (voyages.length === 0) {
    return res.status(404).json({ error: "Cette destination n'existe pas ou n'a aucun circuit actif." })
  }

  res.json(buildDestinationObject(voyages[0].destination, voyages))
})

// POST /api/destinations — compatibilité admin
router.post('/', authRequired, adminOnly, async (req, res) => {
  const { name, nom } = req.body
  const destName = (nom || name || '').trim()
  if (!destName) return res.status(400).json({ error: 'Nom de destination manquant.' })
  res.status(201).json({ id: destName, name: destName, nom: destName })
})

// PUT /api/destinations/:id — modification groupée du nom de la destination
router.put('/:id', authRequired, adminOnly, async (req, res) => {
  const oldName = decodeURIComponent(req.params.id).trim()
  const { name, nom } = req.body
  const newName = (nom || name || '').trim()

  if (!newName) return res.status(400).json({ error: 'Nouveau nom de destination requis.' })

  await prisma.voyage.updateMany({
    where: { destination: { equals: oldName, mode: 'insensitive' } },
    data: { destination: newName },
  })

  const updatedVoyages = await prisma.voyage.findMany({
    where: { destination: { equals: newName, mode: 'insensitive' } },
  })

  res.json(buildDestinationObject(newName, updatedVoyages))
})

// DELETE /api/destinations/:id — suppression/annulation des voyages de cette destination
router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  const destName = decodeURIComponent(req.params.id).trim()
  await prisma.voyage.updateMany({
    where: { destination: { equals: destName, mode: 'insensitive' } },
    data: { statut: 'Annulé', nb_disponible: 0 },
  })
  res.json({ ok: true })
})

export default router
