import { prisma } from '../src/lib/prisma.js'
import jwt from 'jsonwebtoken'

async function testDynamicTripStatus() {
  console.log('================================================================================')
  console.log('🧪 TEST : GESTION DYNAMIQUE DU STATUT DES VOYAGES PASSÉS (DATE DE RETOUR)')
  console.log('================================================================================\n')

  // 1. Créer un voyage passé temporaire
  const pastTrip = await prisma.voyage.create({
    data: {
      titre: 'Voyage Test Historique Rome',
      destination: 'Rome, Italie',
      description: 'Voyage de test avec dates passées',
      date_de_depart: new Date('2024-05-10T10:00:00.000Z'),
      date_de_retour: new Date('2024-05-15T18:00:00.000Z'),
      prix: 450,
      nb_total: 20,
      nb_disponible: 15,
      programme: JSON.stringify(['Arrivée Colisée', 'Visite Vatican', 'Retour']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80']),
      statut: 'ACTIVE',
    },
  })
  console.log(`✅ Voyage de test créé (ID: ${pastTrip.id}, Retour: ${pastTrip.date_de_retour.toISOString().slice(0, 10)})`)

  // 2. Vérifier que GET /api/trips renvoie statut: 'Passé' et isPast: true
  const resTrips = await fetch('http://localhost:4000/api/trips')
  const tripsData = await resTrips.json()
  const fetchedPastTrip = tripsData.find((t) => t.id === pastTrip.id)

  console.log('\nÉtape 1: Consultation publique (GET /api/trips)...')
  console.log(`  -> Statut calculé : "${fetchedPastTrip?.statut}" (Expected: "Passé")`)
  console.log(`  -> isPast : ${fetchedPastTrip?.isPast} (Expected: true)`)

  if (fetchedPastTrip?.statut !== 'Passé' || fetchedPastTrip?.isPast !== true) {
    throw new Error('Le voyage avec date de retour échue doit avoir le statut "Passé" et isPast=true')
  }

  // 3. Tenter de réserver ce voyage passé
  console.log('\nÉtape 2: Tentative de réservation d\'un voyage passé (POST /api/reservations)...')
  const ahmed = await prisma.user.findUnique({ where: { email: 'ahmed@email.com' } })
  const token = jwt.sign({ userId: ahmed.id }, process.env.JWT_SECRET || 'secret_travelplan', { expiresIn: '1h' })

  const resBooking = await fetch('http://localhost:4000/api/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tripId: pastTrip.id,
      quantity: 1,
    }),
  })

  const bookingData = await resBooking.json()
  console.log(`  -> Code HTTP de réponse : ${resBooking.status} (Expected: 400)`)
  console.log(`  -> Message d'erreur : "${bookingData.error}"`)

  if (resBooking.status !== 400 || !bookingData.error.toLowerCase().includes('passé')) {
    throw new Error('La réservation du voyage passé aurait dû être rejetée en HTTP 400 !')
  }

  // 4. Nettoyage
  await prisma.voyage.delete({ where: { id: pastTrip.id } })
  console.log('\n✅ Nettoyage terminé.')

  console.log('\n================================================================================')
  console.log('🎉 TOUS LES TESTS DE STATUT DYNAMIQUE ET BLOCAGE DE RÉSERVATION ONT RÉUSSI !')
  console.log('================================================================================')
}

testDynamicTripStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
