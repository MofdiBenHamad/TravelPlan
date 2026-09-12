import { prisma } from '../src/lib/prisma.js'

async function testReviewCondition() {
  console.log('======================================================')
  console.log('🧪 TEST DE LA CONDITION DE DÉPÔT D\'AVIS (DATE DE FIN)')
  console.log('======================================================\n')

  const ahmed = await prisma.user.findUnique({ where: { email: 'ahmed@email.com' } })
  if (!ahmed) throw new Error('Utilisateur Ahmed introuvable')

  // 1. Voyage FUTUR (non terminé)
  const futureTrip = await prisma.voyage.findFirst({
    where: { date_de_retour: { gt: new Date() } },
  })

  // 2. Voyage PASSÉ (terminé)
  let pastTrip = await prisma.voyage.findFirst({
    where: { date_de_retour: { lt: new Date() } },
  })

  if (!pastTrip) {
    pastTrip = await prisma.voyage.create({
      data: {
        destination: 'Sousse, Tunisie',
        titre: 'Voyage Test Terminé Passé',
        description: 'Séjour de test passé pour validation avis',
        date_de_depart: new Date('2026-07-01'),
        date_de_retour: new Date('2026-07-08'),
        prix: 300,
        nb_total: 10,
        nb_disponible: 10,
        programme: JSON.stringify(['Jour 1', 'Jour 2']),
        images: JSON.stringify(['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80']),
      },
    })
  }

  // Créer réservation future
  const futureRes = await prisma.reservation.create({
    data: {
      user_id: ahmed.id,
      voyage_id: futureTrip.id,
      statut: 'Confirmée',
      quantite: 1,
    },
  })

  // Créer réservation passée
  const pastRes = await prisma.reservation.create({
    data: {
      user_id: ahmed.id,
      voyage_id: pastTrip.id,
      statut: 'Confirmée',
      quantite: 1,
    },
  })

  const jwt = await import('jsonwebtoken')
  const token = jwt.default.sign({ userId: ahmed.id }, process.env.JWT_SECRET || 'secret_travelplan', { expiresIn: '1d' })

  // Test A : Tentative de review sur le voyage FUTUR -> doit être rejeté (400)
  console.log('Test A: Tentative de dépôt d\'avis pour un voyage FUTUR...')
  const resA = await fetch('http://localhost:4000/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      reservationId: futureRes.id,
      rating: 5,
      comment: 'Super voyage avant la fin (ne devrait pas passer)',
    }),
  })
  const dataA = await resA.json()
  console.log('  -> Statut HTTP (expected 400):', resA.status)
  console.log('  -> Erreur retournée:', dataA.error)

  if (resA.status !== 400) {
    throw new Error('Le dépôt d\'avis sur un voyage non terminé aurait dû être bloqué (400)')
  }

  // Test B : Tentative de review sur le voyage PASSÉ -> doit réussir (201)
  console.log('\nTest B: Tentative de dépôt d\'avis pour un voyage TERMINÉ...')
  const resB = await fetch('http://localhost:4000/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      reservationId: pastRes.id,
      rating: 5,
      comment: 'Expérience extraordinaire, organisation parfaite !',
    }),
  })
  const dataB = await resB.json()
  console.log('  -> Statut HTTP (expected 201):', resB.status)
  console.log('  -> Avis créé avec ID:', dataB.id, 'Note:', dataB.rating || dataB.note)

  if (resB.status !== 201) {
    throw new Error('Le dépôt d\'avis sur un voyage terminé aurait dû réussir (201)')
  }

  // Nettoyage des réservations de test
  await prisma.avis.deleteMany({ where: { reservation_id: { in: [futureRes.id, pastRes.id] } } })
  await prisma.reservation.deleteMany({ where: { id: { in: [futureRes.id, pastRes.id] } } })
  if (pastTrip.titre === 'Voyage Test Terminé Passé') {
    await prisma.voyage.delete({ where: { id: pastTrip.id } })
  }

  console.log('\n======================================================')
  console.log('✅ RÈGLE DE CONDITION DU DÉPÔT D\'AVIS 100% VALIDÉE !')
  console.log('======================================================')
}

testReviewCondition()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
