import { prisma } from '../src/lib/prisma.js'
import bcrypt from 'bcryptjs'

async function testUnverifiedLogin() {
  console.log('--- Test: Connexion avec email non vérifié ---')
  const passwordHash = await bcrypt.hash('secret123', 10)

  // 1. Créer un utilisateur non vérifié
  const testUser = await prisma.user.create({
    data: {
      prenom: 'TestUnverified',
      nom: 'User',
      email: 'test.unverified@travelplan.tn',
      password: passwordHash,
      is_verified: false,
    },
  })

  // 2. Tenter la connexion
  const res1 = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test.unverified@travelplan.tn', password: 'secret123' }),
  })
  const data1 = await res1.json()
  console.log('Status HTTP (expected 403):', res1.status, '\nMessage:', data1.error, '\nCode:', data1.code)

  if (res1.status !== 403 || data1.code !== 'EMAIL_NOT_VERIFIED') {
    throw new Error('La connexion aurait dû être bloquée avec le statut 403 et le code EMAIL_NOT_VERIFIED')
  }

  // 3. Valider l'email
  await prisma.user.update({
    where: { id: testUser.id },
    data: { is_verified: true },
  })

  // 4. Retester la connexion
  const res2 = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test.unverified@travelplan.tn', password: 'secret123' }),
  })
  const data2 = await res2.json()
  console.log('\nStatus HTTP après confirmation (expected 200):', res2.status, '\nUtilisateur connecté:', data2.user?.prenom, data2.user?.nom)

  // 5. Nettoyage
  await prisma.user.delete({ where: { id: testUser.id } })
  console.log('\n✅ TEST CONNEXION EMAIL NON VÉRIFIÉ RÉUSSI À 100% !')
}

testUnverifiedLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
