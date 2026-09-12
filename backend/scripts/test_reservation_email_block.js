import { prisma } from '../src/lib/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

async function testReservationEmailBlock() {
  console.log('================================================================================')
  console.log('🧪 TEST : BLOCAGE DU پیام DE CONFIRMATION SI L\'EMAIL EST INVALIDE OU NON DÉLIVRÉ')
  console.log('================================================================================\n')

  const voyage = await prisma.voyage.findFirst({ where: { statut: 'ACTIVE' } })
  if (!voyage) throw new Error('Aucun voyage actif trouvé')

  // 1. Créer un voyageur avec une adresse email fictive/invalide
  const pwd = await bcrypt.hash('secret123', 10)
  const fakeUser = await prisma.user.create({
    data: {
      prenom: 'Fake',
      nom: 'Traveler',
      email: 'fake.traveler@nonexistent123domain456.xyz',
      password: pwd,
      role: 'VOYAGEUR',
      is_verified: true,
    },
  })

  const fakeToken = jwt.sign({ userId: fakeUser.id }, process.env.JWT_SECRET || 'secret_travelplan', { expiresIn: '1h' })

  // 2. Tenter de créer une réservation avec ce compte à l'email invalide
  console.log('Étape 1: Tentative de réservation avec un compte ayant une adresse email inexistante...')
  const initialAvailable = voyage.nb_disponible
  const res1 = await fetch('http://localhost:4000/api/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fakeToken}`,
    },
    body: JSON.stringify({
      tripId: voyage.id,
      quantity: 1,
    }),
  })
  const data1 = await res1.json()
  console.log('  -> Statut HTTP (expected 400):', res1.status)
  console.log('  -> Message d\'erreur renvoyé :', data1.error)

  if (res1.status !== 400 || data1.confirmationEmailSent === true) {
    throw new Error('La réservation aurait dû être rejetée et le message de succès bloqué !')
  }

  // Vérifier qu'aucune réservation n'a été insérée en base
  const createdRes = await prisma.reservation.findFirst({ where: { user_id: fakeUser.id } })
  console.log('  -> Réservation insérée en base ?', createdRes ? '❌ ERREUR (Réservation créée)' : '✅ NON (Aucune réservation créée)')

  // Vérifier que le nombre de places est intact
  const voyageAfter = await prisma.voyage.findUnique({ where: { id: voyage.id } })
  console.log(`  -> Places disponibles (initial: ${initialAvailable}) : ${voyageAfter.nb_disponible} (Intact : ${voyageAfter.nb_disponible === initialAvailable ? '✅' : '❌'})`)

  // 3. Tester avec un utilisateur ayant une adresse email valide
  console.log('\nÉtape 2: Tentative de réservation avec un compte valide (ahmed@email.com)...')
  const ahmed = await prisma.user.findUnique({ where: { email: 'ahmed@email.com' } })
  const ahmedToken = jwt.sign({ userId: ahmed.id }, process.env.JWT_SECRET || 'secret_travelplan', { expiresIn: '1h' })

  // Nettoyer toute réservation existante d'ahmed sur ce voyage pour le test
  await prisma.reservation.deleteMany({ where: { user_id: ahmed.id, voyage_id: voyage.id } })

  const res2 = await fetch('http://localhost:4000/api/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ahmedToken}`,
    },
    body: JSON.stringify({
      tripId: voyage.id,
      quantity: 1,
    }),
  })
  const data2 = await res2.json()
  console.log('  -> Statut HTTP (expected 201):', res2.status)
  console.log('  -> confirmationEmailSent :', data2.confirmationEmailSent)
  console.log('  -> Réf Réservation :', data2.id)

  if (res2.status !== 201 || !data2.confirmationEmailSent) {
    throw new Error('La réservation valide aurait dû réussir avec confirmationEmailSent=true')
  }

  // Nettoyage
  await prisma.reservation.deleteMany({ where: { user_id: ahmed.id, voyage_id: voyage.id } })
  await prisma.user.delete({ where: { id: fakeUser.id } })
  await prisma.voyage.update({ where: { id: voyage.id }, data: { nb_disponible: initialAvailable } })

  console.log('\n================================================================================')
  console.log('🎉 TOUS LES TESTS DE BLOCAGE ET VALIDATION D\'EMAIL DE RÉSERVATION ONT RÉUSSI !')
  console.log('================================================================================')
}

testReservationEmailBlock()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
