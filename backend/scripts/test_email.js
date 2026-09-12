import 'dotenv/config'
import { sendReservationConfirmationEmail, createAndVerifyTransporter } from '../src/lib/mailer.js'

async function runDiagnostic() {
  console.log('===============================================================')
  console.log('🩺 DIAGNOSTIC COMPLET DU SERVICE D\'ENVOI D\'EMAILS (NODEMAILER)')
  console.log('===============================================================')

  const targetEmail = process.argv[2] || process.env.EMAIL_USER || 'mofdibenhamed79@gmail.com'

  console.log('\n[1] 📋 Vérification des variables d\'environnement :')
  console.log('  - EMAIL_USER :', process.env.EMAIL_USER ? `✅ ${process.env.EMAIL_USER}` : '❌ Non défini')
  console.log('  - EMAIL_PASS :', process.env.EMAIL_PASS ? `✅ Défini (${process.env.EMAIL_PASS.replace(/\s+/g, '').length} caractères)` : '❌ Non défini')
  console.log('  - SMTP_HOST  :', process.env.SMTP_HOST || '(Par défaut : smtp.gmail.com pour Gmail)')
  console.log('  - SMTP_PORT  :', process.env.SMTP_PORT || '465 (SSL direct)')
  console.log('  - CLIENT_URL :', process.env.CLIENT_URL || 'http://localhost:5173')

  console.log('\n[2] 🔌 Test de connexion et d\'authentification SMTP...')
  try {
    const transporter = await createAndVerifyTransporter()
    console.log('  -> Résultat : ✅ Authentification SMTP acceptée par le serveur distant !')
  } catch (connErr) {
    console.error('  -> Résultat : ❌ Échec de la connexion SMTP :', connErr)
    return
  }

  console.log(`\n[3] 📨 Envoi d'un email de test réel vers : ${targetEmail}...`)
  const testData = {
    user: {
      firstName: 'Mofdi (Test)',
      lastName: 'Ben Hamed',
      email: targetEmail,
    },
    trip: {
      title: 'Voyage Test Diagnostic Système',
      destination: { name: 'Tunis / Djerba, Tunisie' },
      departureDate: new Date('2026-09-20'),
      returnDate: new Date('2026-09-27'),
      price: 520,
    },
    reservation: {
      id: 'diag-' + Date.now().toString(36),
      quantity: 2,
    },
    total: 1040,
  }

  const result = await sendReservationConfirmationEmail(testData)

  console.log('\n[4] 📊 Résultat final de l\'envoi :')
  if (result.ok) {
    console.log('  - Statut         : ✅ SUCCÈS (Email délivré au serveur SMTP)')
    console.log('  - MessageID      :', result.messageId)
    console.log('  - Réponse SMTP   :', result.response || 'OK')
    console.log('  - Lien de conf.  :', result.verificationLink)
    console.log('  - Échéance 48h   :', result.expiresAt)
    console.log('\n🎉 Tout fonctionne parfaitement ! Vérifiez votre boîte de réception (et vos spams si nécessaire).')
  } else {
    console.error('  - Statut         : ❌ ÉCHEC')
    console.error('  - Erreur         :', result.error)
    console.error('  - Code           :', result.code)
    console.error('  - Détails        :', result.details)
    console.log('\n💡 Conseil de dépannage :')
    console.log('  1. Vérifiez que la validation en 2 étapes est activée sur votre compte Google.')
    console.log('  2. Créez un mot de passe d\'application dédié (16 caractères) sur https://myaccount.google.com/apppasswords.')
  }
  console.log('===============================================================\n')
}

runDiagnostic().catch(console.error)
