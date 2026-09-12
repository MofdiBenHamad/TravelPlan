import { prisma } from '../src/lib/prisma.js'

async function testUserRegistrationVerification() {
  console.log('==================================================================')
  console.log('🧪 TEST DU WORKFLOW COMPLET D\'INSCRIPTION & ACTIVATION PAR EMAIL')
  console.log('==================================================================\n')

  const testEmail = 'test.activateur.travel@gmail.com'

  // Nettoyer si existant
  await prisma.user.deleteMany({ where: { email: testEmail } })

  // 1. Inscription d'un nouvel utilisateur
  console.log('Étape 1: Inscription du nouvel utilisateur...')
  const regRes = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Sami',
      lastName: 'Trabelsi',
      email: testEmail,
      password: 'password123',
    }),
  })
  const regData = await regRes.json()
  console.log('  -> Statut HTTP inscription (expected 201):', regRes.status)
  console.log('  -> Requires Verification:', regData.requiresVerification)
  console.log('  -> Email d\'activation envoyé:', regData.verificationEmailSent)

  // 2. Vérifier en base que isVerified est bien false
  const userInDb = await prisma.user.findUnique({ where: { email: testEmail } })
  console.log('\nÉtape 2: Vérification en base de données :')
  console.log('  -> Utilisateur trouvé:', userInDb.email)
  console.log('  -> Statut isVerified (expected false):', userInDb.isVerified)

  if (userInDb.isVerified !== false) {
    throw new Error('isVerified devrait être false après l\'inscription')
  }

  // 3. Tenter de se connecter AVANT vérification -> doit être rejeté (403)
  console.log('\nÉtape 3: Tentative de connexion avant activation email...')
  const unverifiedLoginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
    }),
  })
  const unverifiedLoginData = await unverifiedLoginRes.json()
  console.log('  -> Statut HTTP connexion non vérifiée (expected 403):', unverifiedLoginRes.status)
  console.log('  -> Message d\'erreur bloquant:', unverifiedLoginData.error)

  if (unverifiedLoginRes.status !== 403) {
    throw new Error('La connexion devrait être bloquée (403) pour un compte non vérifié')
  }

  // 4. Générer ou récupérer le jeton de vérification pour ce compte
  const jwt = await import('jsonwebtoken')
  const verificationToken = jwt.default.sign(
    { userId: userInDb.id, email: userInDb.email, type: 'email_verification' },
    process.env.JWT_SECRET || 'secret_travelplan',
    { expiresIn: '24h' }
  )

  // 5. Activer le compte via le endpoint GET /api/auth/verify-email
  console.log('\nÉtape 4: Clic sur le lien d\'activation (/api/auth/verify-email)...')
  const verifyRes = await fetch(`http://localhost:4000/api/auth/verify-email?token=${verificationToken}`)
  const verifyData = await verifyRes.json()
  console.log('  -> Statut HTTP activation (expected 200):', verifyRes.status)
  console.log('  -> Message retour:', verifyData.message)

  // 6. Vérifier en base que isVerified est désormais true
  const activatedUserInDb = await prisma.user.findUnique({ where: { email: testEmail } })
  console.log('\nÉtape 5: Vérification en base après activation :')
  console.log('  -> Statut isVerified (expected true):', activatedUserInDb.isVerified)

  if (activatedUserInDb.isVerified !== true) {
    throw new Error('isVerified devrait être true après validation du lien')
  }

  // 7. Tenter de se connecter APRÈS vérification -> doit réussir (200)
  console.log('\nÉtape 6: Connexion après activation réussie...')
  const verifiedLoginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
    }),
  })
  const verifiedLoginData = await verifiedLoginRes.json()
  console.log('  -> Statut HTTP connexion (expected 200):', verifiedLoginRes.status)
  console.log('  -> Token JWT reçu:', Boolean(verifiedLoginData.token))
  console.log('  -> Voyageur connecté:', verifiedLoginData.user?.firstName, verifiedLoginData.user?.lastName)

  if (verifiedLoginRes.status !== 200 || !verifiedLoginData.token) {
    throw new Error('La connexion devrait réussir avec un token après activation')
  }

  // Nettoyage de l'utilisateur de test
  await prisma.user.delete({ where: { email: testEmail } })
  console.log('\n🧹 Compte de test nettoyé.')

  console.log('\n==================================================================')
  console.log('🎉 TOUS LES TESTS D\'ACTIVATION ET VÉRIFICATION DE COMPTE ONT RÉUSSI !')
  console.log('==================================================================')
}

testUserRegistrationVerification()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
