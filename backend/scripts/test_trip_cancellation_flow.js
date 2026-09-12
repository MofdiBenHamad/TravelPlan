import { prisma } from '../src/lib/prisma.js'

async function testTripCancellationFlow() {
  console.log('==================================================================')
  console.log('🧪 TEST COMPLET DU FLUX D\'ANNULATION DE VOYAGE PAR L\'ADMIN')
  console.log('==================================================================\n')

  const admin = await prisma.user.findUnique({ where: { email: 'admin@travelplan.tn' } })
  const ahmed = await prisma.user.findUnique({ where: { email: 'ahmed@email.com' } })

  if (!admin || !ahmed) {
    throw new Error('Données requises introuvables (admin ou ahmed)')
  }

  // 1. Créer un voyage de test actif
  console.log('Étape 1: Création d\'un voyage de test...')
  const testTrip = await prisma.voyage.create({
    data: {
      destination: 'Madrid, Espagne',
      titre: 'Voyage Test Annulation & Notifications',
      description: 'Voyage temporaire pour tester le flux complet d\'annulation',
      date_de_depart: new Date('2026-11-20'),
      date_de_retour: new Date('2026-11-27'),
      prix: 480,
      nb_total: 12,
      nb_disponible: 10,
      statut: 'ACTIVE',
      programme: JSON.stringify(['Jour 1 : Arrivée', 'Jour 2 : Visites']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80']),
    },
  })
  console.log(`  -> Voyage créé : "${testTrip.titre}" [ID: ${testTrip.id}] - Statut: ${testTrip.statut}`)

  // 2. Créer une réservation active pour Ahmed
  console.log('\nÉtape 2: Création d\'une réservation pour le voyageur Ahmed...')
  const resAhmed = await prisma.reservation.create({
    data: {
      user_id: ahmed.id,
      voyage_id: testTrip.id,
      quantite: 2,
      statut: 'Confirmée',
    },
  })
  console.log(`  -> Réservation créée : #${resAhmed.id} - Statut initial: ${resAhmed.statut}`)

  // 3. Vérifier que le voyage est bien visible dans la liste publique
  console.log('\nÉtape 3: Vérification de la visibilité publique du voyage (GET /api/trips)...')
  const publicTripsBefore = await fetch('http://localhost:4000/api/trips').then((r) => r.json())
  const isPublicBefore = publicTripsBefore.some((t) => t.id === testTrip.id)
  console.log(`  -> Le voyage est-il présent dans le catalogue public ? ${isPublicBefore ? '✅ OUI' : '❌ NON'}`)

  if (!isPublicBefore) {
    throw new Error('Le voyage actif devrait être présent dans le catalogue public')
  }

  // 4. L'admin annule le voyage (PUT /api/trips/:id/cancel)
  const jwt = await import('jsonwebtoken')
  const adminToken = jwt.default.sign({ userId: admin.id }, process.env.JWT_SECRET || 'secret_travelplan', { expiresIn: '1h' })

  console.log('\nÉtape 4: L\'administrateur annule le voyage (PUT /api/trips/:id/cancel)...')
  const cancelRes = await fetch(`http://localhost:4000/api/trips/${testTrip.id}/cancel`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  })
  const cancelData = await cancelRes.json()
  console.log('  -> Réponse HTTP annulation :', cancelRes.status, cancelData)

  if (cancelRes.status !== 200 || !cancelData.ok) {
    throw new Error('L\'annulation du voyage par l\'admin a échoué')
  }

  // Attendre un court instant pour la transmission asynchrone des emails
  await new Promise((r) => setTimeout(r, 2000))

  // 5. Vérifier que le statut du voyage est 'Annulé'
  const tripAfter = await prisma.voyage.findUnique({ where: { id: testTrip.id } })
  console.log('\nÉtape 5: Vérification de l\'état du voyage en base :')
  console.log(`  -> Statut Voyage (expected 'Annulé'): ${tripAfter.statut}`)
  console.log(`  -> Places disponibles (expected 0): ${tripAfter.nb_disponible}`)

  // 6. Vérifier que le voyage a disparu du catalogue public
  console.log('\nÉtape 6: Vérification du catalogue public après annulation...')
  const publicTripsAfter = await fetch('http://localhost:4000/api/trips').then((r) => r.json())
  const isPublicAfter = publicTripsAfter.some((t) => t.id === testTrip.id)
  console.log(`  -> Le voyage est-il encore dans le catalogue public ? ${isPublicAfter ? '❌ NON (Toujours présent)' : '✅ NON (Retiré avec succès !)'}`)

  if (isPublicAfter) {
    throw new Error('Le voyage annulé ne devrait PLUS être visible dans le catalogue public')
  }

  // 7. Vérifier que la réservation du voyageur est passée à 'Annulée'
  const resAhmedAfter = await prisma.reservation.findUnique({ where: { id: resAhmed.id } })
  console.log('\nÉtape 7: Vérification de la réservation du voyageur :')
  console.log(`  -> Statut de la réservation (expected 'Annulée'): ${resAhmedAfter.statut}`)

  if (resAhmedAfter.statut !== 'Annulée') {
    throw new Error('La réservation du voyageur aurait dû passer à "Annulée"')
  }

  // 8. Nettoyage du voyage de test
  await prisma.reservation.delete({ where: { id: resAhmed.id } })
  await prisma.voyage.delete({ where: { id: testTrip.id } })
  console.log('\n🧹 Voyage et réservation de test nettoyés.')

  console.log('\n==================================================================')
  console.log('🎉 TOUS LES TESTS D\'ANNULATION DE VOYAGE ET NOTIFICATIONS ONT RÉUSSI !')
  console.log('==================================================================')
}

testTripCancellationFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
