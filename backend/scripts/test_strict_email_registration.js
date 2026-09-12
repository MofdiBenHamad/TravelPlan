import { prisma } from '../src/lib/prisma.js'

async function testStrictEmailRegistration() {
  console.log('==================================================================')
  console.log('🧪 TEST DE LA VALIDATION STRICTE D\'EMAIL (FORMAT, DOMAINE & MX)')
  console.log('==================================================================\n')

  // 1. Test Inscription avec domaine inexistant / sans MX
  console.log('Test 1: Tentative d\'inscription avec un faux domaine inexistant...')
  const res1 = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prenom: 'Fake',
      nom: 'User',
      email: 'fake.user@fake123nonexistentdomain999.xyz',
      password: 'password123',
    }),
  })
  const data1 = await res1.json()
  console.log('  -> Statut HTTP (expected 400):', res1.status)
  console.log('  -> Message renvoyé :', data1.error)

  if (res1.status !== 400 || !data1.error) {
    throw new Error('L\'inscription avec un faux domaine aurait dû être bloquée (400)')
  }

  // 2. Test Inscription avec faute de frappe dans le domaine
  console.log('\nTest 2: Tentative d\'inscription avec domaine erroné (ex: gnail.cmo)...')
  const res2 = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prenom: 'Typo',
      nom: 'User',
      email: 'user.test@gnail.cmo',
      password: 'password123',
    }),
  })
  const data2 = await res2.json()
  console.log('  -> Statut HTTP (expected 400):', res2.status)
  console.log('  -> Message renvoyé :', data2.error)

  if (res2.status !== 400) {
    throw new Error('L\'inscription avec un domaine erroné aurait dû être bloquée (400)')
  }

  // 3. Test Inscription avec syntaxe invalide
  console.log('\nTest 3: Tentative d\'inscription avec syntaxe invalide (points consécutifs)...')
  const res3 = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prenom: 'Syntax',
      nom: 'User',
      email: 'invalid..syntax@gmail.com',
      password: 'password123',
    }),
  })
  const data3 = await res3.json()
  console.log('  -> Statut HTTP (expected 400):', res3.status)
  console.log('  -> Message renvoyé :', data3.error)

  if (res3.status !== 400) {
    throw new Error('L\'inscription avec syntaxe invalide aurait dû être bloquée (400)')
  }

  // 4. Test Inscription avec email réel et valide
  console.log('\nTest 4: Inscription avec email réel et valide...')
  const uniqueRealEmail = `test.real.${Date.now()}@gmail.com`
  const res4 = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prenom: 'Real',
      nom: 'Traveler',
      email: uniqueRealEmail,
      password: 'password123',
    }),
  })
  const data4 = await res4.json()
  console.log('  -> Statut HTTP (expected 201):', res4.status)
  console.log('  -> Utilisateur créé avec succès :', data4.user?.prenom, data4.user?.nom, `(${data4.user?.email})`)

  if (res4.status !== 201) {
    throw new Error(`L'inscription avec email réel aurait dû réussir : ${JSON.stringify(data4)}`)
  }

  // Nettoyage de l'utilisateur créé
  if (data4.user?.id) {
    await prisma.user.delete({ where: { id: data4.user.id } })
  }

  console.log('\n==================================================================')
  console.log('🎉 TOUS LES TESTS DE VALIDATION STRICTE D\'EMAIL ONT RÉUSSI !')
  console.log('==================================================================')
}

testStrictEmailRegistration()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
