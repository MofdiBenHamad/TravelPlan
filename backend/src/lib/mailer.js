import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken'

let cachedTransporter = null

/**
 * Nettoie et valide les variables d'environnement pour l'envoi d'emails.
 */
function getEmailConfig() {
  const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim()
  const emailPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').replace(/\s+/g, '').trim()
  const smtpHost = (process.env.SMTP_HOST || '').trim()
  const smtpPort = Number(process.env.SMTP_PORT) || 465
  const resendKey = (process.env.RESEND_API_KEY || '').trim()
  const sendgridKey = (process.env.SENDGRID_API_KEY || '').trim()

  return { emailUser, emailPass, smtpHost, smtpPort, resendKey, sendgridKey }
}

/**
 * Crée et teste le transporteur SMTP avec journalisation détaillée.
 */
export async function createAndVerifyTransporter() {
  const { emailUser, emailPass, smtpHost, smtpPort, resendKey, sendgridKey } = getEmailConfig()

  let transporter = null
  let providerName = 'Inconnu'

  // 1. Service Resend
  if (resendKey) {
    providerName = 'Resend SMTP'
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: resendKey,
      },
    })
  }
  // 2. Service SendGrid
  else if (sendgridKey) {
    providerName = 'SendGrid SMTP'
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: sendgridKey,
      },
    })
  }
  // 3. Gmail (Authentification par mot de passe d'application Google)
  else if (emailUser && emailPass && (emailUser.endsWith('@gmail.com') || process.env.SMTP_SERVICE === 'gmail')) {
    providerName = `Gmail Direct (${emailUser})`
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })
  }
  // 4. Serveur SMTP personnalisé (Host, Port, User, Pass)
  else if (smtpHost && emailUser && emailPass) {
    providerName = `SMTP Personnalisé (${smtpHost}:${smtpPort})`
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })
  }
  // 5. Fallback Ethereal (Compte de test développement)
  else {
    try {
      providerName = 'Ethereal Test Mailer'
      const testAccount = await nodemailer.createTestAccount()
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
      console.log(`[Mailer] ℹ️ Compte Ethereal temporaire : ${testAccount.user}`)
    } catch (e) {
      providerName = 'Simulation Console'
      transporter = {
        sendMail: async (opts) => {
          console.log(`\n[Mailer Simulation] Envoi à: ${opts.to} | Sujet: ${opts.subject}`)
          return { messageId: 'simulated-' + Date.now(), response: '250 Simulated OK' }
        },
        verify: async () => true,
      }
    }
  }

  console.log(`[Mailer] ⚙️ Configuration du service : ${providerName}`)

  // Vérification de la connexion SMTP
  if (typeof transporter.verify === 'function') {
    try {
      await transporter.verify()
      console.log(`[Mailer] ✅ Connexion SMTP validée avec succès (${providerName})`)
    } catch (verifyErr) {
      console.error(`[Mailer] ❌ Échec de la vérification SMTP (${providerName}) :`, {
        code: verifyErr.code,
        message: verifyErr.message,
        response: verifyErr.response,
        responseCode: verifyErr.responseCode,
      })
    }
  }

  return transporter
}

/**
 * Récupère le transporteur mis en cache ou en initialise un nouveau.
 */
export async function getTransporter(forceRefresh = false) {
  if (!cachedTransporter || forceRefresh) {
    cachedTransporter = await createAndVerifyTransporter()
  }
  return cachedTransporter
}

/**
 * Valide syntaxiquement une adresse email.
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Envoie un email d'activation / vérification de compte lors de l'inscription.
 */
export async function sendAccountVerificationEmail({ user, token, verificationLink }) {
  console.log('\n============================================================')
  console.log('[Mailer] 👤 Envoi d\'email de vérification de compte')
  console.log('============================================================')

  const recipientEmail = (user?.email || '').trim()
  if (!isValidEmail(recipientEmail)) {
    const errMsg = `Adresse email invalide: "${recipientEmail}"`
    console.error(`[Mailer] ❌ Erreur : ${errMsg}`)
    return { ok: false, error: errMsg }
  }

  const { emailUser } = getEmailConfig()
  const fromEmail = emailUser || 'contact@travelplan.tn'
  const fromHeader = process.env.SMTP_FROM || `"TravelPlan Voyages" <${fromEmail}>`
  const subject = `✈ Activez votre compte TravelPlan (${user.firstName || 'Voyageur'})`

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080c14; color: #1e293b; margin: 0; padding: 24px 10px; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.35); border: 1px solid rgba(212, 175, 55, 0.3); }
    .header { background: linear-gradient(135deg, #090d16 0%, #141c2e 100%); color: #ffffff; padding: 36px 28px; text-align: center; border-bottom: 3px solid #d4af37; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em; color: #d4af37; text-transform: uppercase; }
    .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; color: #fdfbf7; }
    .content { padding: 34px 30px; }
    
    .status-badge { display: inline-flex; align-items: center; gap: 6px; background: #fef3c7; color: #92400e; border: 1.5px solid #fde68a; padding: 7px 16px; border-radius: 999px; font-weight: 700; font-size: 13px; margin-bottom: 22px; text-transform: uppercase; letter-spacing: 0.04em; }
    .greeting { font-size: 18px; margin-bottom: 14px; color: #090d16; }
    
    .verify-box { background: linear-gradient(135deg, #090d16 0%, #172338 100%); border: 2px solid #d4af37; border-radius: 14px; padding: 30px 20px; text-align: center; margin: 28px 0; color: #ffffff; }
    .verify-box h3 { margin: 0 0 10px 0; color: #d4af37; font-size: 19px; }
    .verify-box p { margin: 0 0 22px 0; color: #e2e8f0; font-size: 14px; line-height: 1.5; }
    
    .btn-verify { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f3cf7a 100%); color: #090d16 !important; text-decoration: none; padding: 16px 36px; font-size: 16px; font-weight: 800; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 6px 20px rgba(212, 175, 55, 0.45); }
    
    .info-card { background: #fdfbf7; border: 1px solid #e9e4d9; border-radius: 10px; padding: 18px; margin: 20px 0; font-size: 14px; color: #475569; }
    
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #94a3b8; background: #090d16; border-top: 1px solid rgba(255,255,255,0.08); }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>✈ TravelPlan</h1>
      <p>Vérification & Activation de votre Compte</p>
    </div>
    <div class="content">
      <div style="margin-bottom: 18px;">
        <span class="status-badge">✉ Activation Requise</span>
      </div>

      <p class="greeting">Bienvenue <strong>${user.firstName} ${user.lastName}</strong> !</p>
      <p style="line-height: 1.6; color: #475569;">
        Nous sommes ravis de vous compter parmi nos voyageurs. Pour des raisons de sécurité et pour activer votre accès aux réservations, <strong>veuillez confirmer votre adresse email</strong> en cliquant sur le bouton ci-dessous :
      </p>

      <div class="verify-box">
        <h3>Activez votre compte voyageur</h3>
        <p>Ce lien d'activation sécurisé est valable pendant 24 heures.</p>
        <a href="${verificationLink}" class="btn-verify">
          ✓ Activer mon compte
        </a>
      </div>

      <div class="info-card">
        <strong>Pourquoi cette vérification ?</strong><br/>
        Elle garantit que vous recevrez en toute sécurité vos confirmations de billets, bons d'embarquement et récapitulatifs de séjour.
      </div>

      <p style="font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 24px; text-align: center;">
        Si le bouton ne s'affiche pas, copiez-collez ce lien :<br/>
        <a href="${verificationLink}" style="color: #d4af37;">${verificationLink}</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>TravelPlan Agence de Voyages</strong></p>
      <p>Avenue Habib Bourguiba, Tunis · (+216) 71 000 000 · ${fromEmail}</p>
    </div>
  </div>
</body>
</html>
  `

  const textContent = `
TravelPlan — Activation de votre Compte
==================================================
Bienvenue ${user.firstName} ${user.lastName},

Pour activer votre compte voyageur TravelPlan, veuillez cliquer sur le lien sécurisé suivant :
${verificationLink}

Ce lien est valable 24 heures.

Merci de votre confiance et à très bientôt sur TravelPlan !
  `

  try {
    const mailer = await getTransporter()
    console.log(`[Mailer] 📤 Envoi de l'activation vers : ${recipientEmail}`)

    const info = await mailer.sendMail({
      from: fromHeader,
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
    })

    console.log(`[Mailer] ✅ Email d'activation délivré à : ${recipientEmail} (MessageID : ${info.messageId})`)
    return { ok: true, messageId: info.messageId }
  } catch (error) {
    console.error('[Mailer] ❌ Échec envoi email d\'activation :', error)
    return { ok: false, error: error.message }
  }
}

/**
 * Envoie un email avec lien sécurisé de confirmation de réservation au voyageur.
 */
export async function sendReservationConfirmationEmail({ user, trip, reservation, total }) {
  console.log('\n============================================================')
  console.log('[Mailer] 🚀 Début du processus d\'envoi d\'email de confirmation')
  console.log('============================================================')

  // 1. Validation du destinataire
  const recipientEmail = (user?.email || '').trim()
  if (!isValidEmail(recipientEmail)) {
    const errMsg = `Adresse email de destination invalide ou manquante: "${recipientEmail}"`
    console.error(`[Mailer] ❌ Erreur : ${errMsg}`)
    return { ok: false, error: errMsg }
  }

  const { emailUser } = getEmailConfig()
  const fromEmail = emailUser || 'contact@travelplan.tn'
  const fromHeader = process.env.SMTP_FROM || `"TravelPlan Voyages" <${fromEmail}>`
  
  const userPrenom = user?.prenom || user?.firstName || 'Voyageur'
  const userNom = user?.nom || user?.lastName || ''
  const refCode = reservation?.id ? reservation.id.slice(-8).toUpperCase() : 'N/A'
  const tripTitle = trip?.titre || trip?.title || 'Circuit TravelPlan'
  const destinationName = trip?.destination?.nom || trip?.destination?.name || trip?.destinationName || 'Destination'
  const unitPrice = trip?.prix !== undefined ? trip.prix : (trip?.price || 0)
  const qty = reservation?.quantite !== undefined ? reservation.quantite : (reservation?.quantity || 1)
  const totalAmount = total !== undefined ? total : unitPrice * qty

  // 1. Génération d'un token sécurisé JWT valide 48 heures
  const confirmationToken = jwt.sign(
    {
      reservationId: reservation?.id,
      userId: user?.id,
      userEmail: recipientEmail,
      type: 'confirm_reservation',
    },
    process.env.JWT_SECRET || 'secret_travelplan',
    { expiresIn: '48h' }
  )

  // 2. Construction du lien de validation
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  const verificationLink = `${clientUrl}/confirmer-reservation?token=${confirmationToken}`

  // 3. Calcul de la date d'expiration (48 heures)
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const departureDate = (trip?.date_de_depart || trip?.departureDate)
    ? new Date(trip?.date_de_depart || trip?.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date à confirmer'
  const returnDate = (trip?.date_de_retour || trip?.returnDate)
    ? new Date(trip?.date_de_retour || trip?.returnDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date à confirmer'

  const subject = `✈ Action requise : Confirmez votre réservation pour ${tripTitle} (Réf : #${refCode})`

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080c14; color: #1e293b; margin: 0; padding: 24px 10px; }
    .wrapper { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.35); border: 1px solid rgba(212, 175, 55, 0.3); }
    .header { background: linear-gradient(135deg, #090d16 0%, #141c2e 100%); color: #ffffff; padding: 36px 28px; text-align: center; border-bottom: 3px solid #d4af37; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.05em; color: #d4af37; text-transform: uppercase; }
    .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; color: #fdfbf7; }
    .content { padding: 34px 30px; }
    
    .status-badge { display: inline-flex; align-items: center; gap: 6px; background: #fef3c7; color: #92400e; border: 1.5px solid #fde68a; padding: 7px 16px; border-radius: 999px; font-weight: 700; font-size: 13px; margin-bottom: 22px; text-transform: uppercase; letter-spacing: 0.04em; }
    .expiration-pill { display: inline-block; background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-left: 8px; }
    
    .greeting { font-size: 18px; margin-bottom: 14px; color: #090d16; }
    
    .table-card { width: 100%; border-collapse: collapse; background: #fdfbf7; border: 1px solid #e9e4d9; border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
    .table-card th, .table-card td { padding: 13px 18px; text-align: left; font-size: 14px; }
    .table-card tr:not(:last-child) { border-bottom: 1px solid #eee7dc; }
    .table-card th { color: #64748b; font-weight: 600; width: 42%; }
    .table-card td { color: #090d16; font-weight: 700; }
    
    .total-row { background: #f8f5ee; border-top: 2px dashed #d1c7b7 !important; }
    .total-row th { color: #090d16; font-size: 16px; }
    .total-row td { color: #059669; font-size: 20px; font-weight: 800; }
    
    .verify-box { background: linear-gradient(135deg, #090d16 0%, #172338 100%); border: 2px solid #d4af37; border-radius: 14px; padding: 28px 20px; text-align: center; margin: 28px 0; color: #ffffff; }
    .verify-box h3 { margin: 0 0 10px 0; color: #d4af37; font-size: 18px; }
    .verify-box p { margin: 0 0 20px 0; color: #e2e8f0; font-size: 14px; line-height: 1.5; }
    
    .btn-verify { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f3cf7a 100%); color: #090d16 !important; text-decoration: none; padding: 16px 36px; font-size: 16px; font-weight: 800; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 6px 20px rgba(212, 175, 55, 0.45); }
    
    .instructions { background: #fffdf5; border: 1px solid #fef3c7; border-left: 5px solid #d4af37; padding: 22px; border-radius: 8px; margin-top: 26px; }
    .instructions h3 { margin: 0 0 12px 0; font-size: 16px; color: #92400e; }
    .instructions p, .instructions ul { margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: #78350f; }
    .instructions ul { padding-left: 20px; }
    
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #94a3b8; background: #090d16; border-top: 1px solid rgba(255,255,255,0.08); }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>✈ TravelPlan</h1>
      <p>Confirmation Requise de votre Réservation</p>
    </div>
    <div class="content">
      <div style="margin-bottom: 18px;">
        <span class="status-badge">⏳ En attente de confirmation</span>
        <span class="expiration-pill">⏱ Expire dans 48h</span>
      </div>

      <p class="greeting">Bonjour <strong>${userPrenom} ${userNom}</strong>,</p>
      <p style="line-height: 1.6; color: #475569;">
        Vous venez d'effectuer une demande de réservation pour le circuit <strong>${tripTitle}</strong>. Afin de valider définitivement votre dossier et bloquer vos places, <strong>veuillez confirmer votre réservation en cliquant sur le bouton ci-dessous</strong>.
      </p>

      <div class="verify-box">
        <h3>Validez votre réservation en 1 clic</h3>
        <p>Ce lien sécurisé est valable pendant 48 heures (jusqu'au ${expiresAt}).</p>
        <a href="${verificationLink}" class="btn-verify">
          ✓ Confirmer ma réservation
        </a>
      </div>
      
      <table class="table-card">
        <tr>
          <th>Référence provisoire</th>
          <td>#${refCode}</td>
        </tr>
        <tr>
          <th>Statut actuel</th>
          <td><span style="color: #d97706;">⏳ En attente de confirmation email</span></td>
        </tr>
        <tr>
          <th>Destination</th>
          <td>📍 ${destinationName}</td>
        </tr>
        <tr>
          <th>Circuit / Voyage</th>
          <td>${tripTitle}</td>
        </tr>
        <tr>
          <th>Dates du séjour</th>
          <td>Du ${departureDate} au ${returnDate}</td>
        </tr>
        <tr>
          <th>Tarif unitaire</th>
          <td>${unitPrice} DT / personne</td>
        </tr>
        <tr>
          <th>Nombre de voyageurs</th>
          <td>${qty} voyageur${qty > 1 ? 's' : ''}</td>
        </tr>
        <tr>
          <th>Date limite de validation</th>
          <td style="color: #b45309;">${expiresAt}</td>
        </tr>
        <tr class="total-row">
          <th>Montant total de la transaction</th>
          <td>${totalAmount} DT</td>
        </tr>
      </table>

      <div class="instructions">
        <h3>📋 Prochaines étapes après votre confirmation :</h3>
        <p>Une fois votre réservation confirmée via le bouton ci-dessus :</p>
        <ul>
          <li>Votre statut passera automatiquement à <strong>« Confirmée »</strong>.</li>
          <li>Vous pourrez régler votre séjour dans un délai de 48h en agence ou par virement bancaire (RIB: 08 000 0001234567890 12).</li>
        </ul>
      </div>

      <p style="font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 24px; text-align: center;">
        Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
        <a href="${verificationLink}" style="color: #d4af37;">${verificationLink}</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>TravelPlan Agence de Voyages Internationale</strong></p>
      <p>Avenue Habib Bourguiba, Tunis · (+216) 71 000 000 · ${fromEmail}</p>
    </div>
  </div>
</body>
</html>
  `

  const textContent = `
TravelPlan — Confirmation Requise de votre Réservation
==================================================
Bonjour ${userPrenom} ${userNom},

Vous venez d'effectuer une réservation pour le circuit "${tripTitle}" (${destinationName}).

ACTION REQUISE :
Veuillez cliquer sur le lien suivant sous 48h pour confirmer définitivement votre réservation :
${verificationLink}

RÉCAPITULATIF :
- Référence : #${refCode}
- Statut : En attente de confirmation
- Destination : ${destinationName}
- Circuit : ${tripTitle}
- Dates : Du ${departureDate} au ${returnDate}
- Nombre de personnes : ${qty}
- Tarif par personne : ${unitPrice} DT
- Montant total : ${totalAmount} DT
- Date limite de validation : ${expiresAt}

Merci pour votre confiance !
  `

  try {
    const mailer = await getTransporter()

    console.log(`[Mailer] 📤 Tentative d'envoi vers : ${recipientEmail}`)
    console.log(`[Mailer] 🏷️ De : ${fromHeader}`)
    console.log(`[Mailer] 📌 Sujet : ${subject}`)

    const info = await mailer.sendMail({
      from: fromHeader,
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
    })

    console.log(`[Mailer] ✅ Email délivré avec succès ! MessageID : ${info.messageId}`)
    if (info.response) {
      console.log(`[Mailer] 📡 Réponse du serveur SMTP : ${info.response}`)
    }

    if (info.messageId && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      if (previewUrl) {
        console.log(`[Mailer] 🔗 Aperçu Ethereal : ${previewUrl}`)
      }
    }

    return {
      ok: true,
      messageId: info.messageId,
      response: info.response,
      token: confirmationToken,
      verificationLink,
      expiresAt,
    }
  } catch (error) {
    console.error('[Mailer] ❌ ÉCHEC DE L\'ENVOI SMTP :', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
    })

    return {
      ok: false,
      error: error.message || 'Erreur inconnue lors de l\'envoi de l\'email.',
      code: error.code,
      details: error.response || error.message,
    }
  }
}

/**
 * Envoie un email d'information d'annulation de circuit au voyageur ayant une réservation.
 */
export async function sendTripCancellationEmail({ user, trip, reservation, total }) {
  console.log('\n============================================================')
  console.log('[Mailer] ⚠️ Envoi d\'email d\'annulation de circuit')
  console.log('============================================================')

  const recipientEmail = (user?.email || '').trim()
  if (!isValidEmail(recipientEmail)) {
    const errMsg = `Adresse email destinataire invalide: "${recipientEmail}"`
    console.error(`[Mailer] ❌ Erreur : ${errMsg}`)
    return { ok: false, error: errMsg }
  }

  const { emailUser } = getEmailConfig()
  const fromEmail = emailUser || 'contact@travelplan.tn'
  const fromHeader = process.env.SMTP_FROM || `"TravelPlan Voyages" <${fromEmail}>`

  const userPrenom = user?.prenom || user?.firstName || 'Voyageur'
  const userNom = user?.nom || user?.lastName || ''
  const refCode = reservation?.id ? reservation.id.slice(-8).toUpperCase() : 'N/A'
  const tripTitle = trip?.titre || trip?.title || 'Circuit TravelPlan'
  const destinationName = trip?.destination?.nom || trip?.destination?.name || trip?.destinationName || 'Destination'
  const departureDate = (trip?.date_de_depart || trip?.departureDate)
    ? new Date(trip?.date_de_depart || trip?.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date prévue'
  const returnDate = (trip?.date_de_retour || trip?.returnDate)
    ? new Date(trip?.date_de_retour || trip?.returnDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date prévue'
  const unitPrice = trip?.prix !== undefined ? trip.prix : (trip?.price || 0)
  const qty = reservation?.quantite !== undefined ? reservation.quantite : (reservation?.quantity || 1)
  const totalAmount = total !== undefined ? total : unitPrice * qty

  const subject = `⚠️ Information Importante : Annulation du circuit ${tripTitle} (Réf : #${refCode})`

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080c14; color: #1e293b; margin: 0; padding: 24px 10px; }
    .wrapper { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.35); border: 1px solid rgba(220, 38, 38, 0.3); }
    .header { background: linear-gradient(135deg, #1c0d0d 0%, #2d1214 100%); color: #ffffff; padding: 36px 28px; text-align: center; border-bottom: 3px solid #dc2626; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.05em; color: #f87171; text-transform: uppercase; }
    .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; color: #fee2e2; }
    .content { padding: 34px 30px; }

    .status-badge { display: inline-flex; align-items: center; gap: 6px; background: #fee2e2; color: #991b1b; border: 1.5px solid #fecaca; padding: 7px 16px; border-radius: 999px; font-weight: 700; font-size: 13px; margin-bottom: 22px; text-transform: uppercase; letter-spacing: 0.04em; }
    .greeting { font-size: 18px; margin-bottom: 14px; color: #090d16; }

    .table-card { width: 100%; border-collapse: collapse; background: #fdfbf7; border: 1px solid #e9e4d9; border-radius: 12px; overflow: hidden; margin: 24px 0; }
    .table-card th, .table-card td { padding: 13px 18px; text-align: left; font-size: 14px; }
    .table-card tr:not(:last-child) { border-bottom: 1px solid #eee7dc; }
    .table-card th { color: #64748b; font-weight: 600; width: 42%; }
    .table-card td { color: #090d16; font-weight: 700; }
    
    .notice-box { background: #fef2f2; border: 1.5px solid #fecaca; border-left: 5px solid #dc2626; border-radius: 10px; padding: 20px; margin: 24px 0; color: #991b1b; }
    .notice-box h3 { margin: 0 0 10px 0; font-size: 16px; color: #7f1d1d; }
    .notice-box p { margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; }
    
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #94a3b8; background: #090d16; border-top: 1px solid rgba(255,255,255,0.08); }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>✈ TravelPlan</h1>
      <p>Notification d'Annulation de Circuit</p>
    </div>
    <div class="content">
      <div style="margin-bottom: 18px;">
        <span class="status-badge">✕ Circuit Annulé par l'Agence</span>
      </div>

      <p class="greeting">Bonjour <strong>${userPrenom} ${userNom}</strong>,</p>
      <p style="line-height: 1.6; color: #475569;">
        Nous avons le regret de vous informer que pour des raisons opérationnelles et indépendantes de notre volonté, le circuit <strong>${tripTitle}</strong> prévu du <strong>${departureDate} au ${returnDate}</strong> a dû être <strong>annulé</strong> par notre agence.
      </p>

      <table class="table-card">
        <tr>
          <th>Référence de votre dossier</th>
          <td>#${refCode}</td>
        </tr>
        <tr>
          <th>Statut de la réservation</th>
          <td><span style="color: #dc2626; font-weight: 800;">✕ Annulée</span></td>
        </tr>
        <tr>
          <th>Circuit concerné</th>
          <td>${tripTitle}</td>
        </tr>
        <tr>
          <th>Destination</th>
          <td>📍 ${destinationName}</td>
        </tr>
        <tr>
          <th>Dates initiales</th>
          <td>Du ${departureDate} au ${returnDate}</td>
        </tr>
        <tr>
          <th>Places réservées</th>
          <td>${qty} voyageur${qty > 1 ? 's' : ''}</td>
        </tr>
        <tr>
          <th>Montant du dossier</th>
          <td>${totalAmount} DT</td>
        </tr>
      </table>

      <div class="notice-box">
        <h3>💳 Modalités de Remboursement & Avoir Prioritaire :</h3>
        <p>
          • <strong>Si vous avez déjà effectué un règlement :</strong> Notre service comptabilité procédera au remboursement intégral de votre transaction dans les 48 à 72 heures ouvrées, sans aucuns frais.
        </p>
        <p>
          • <strong>Option report de voyage :</strong> Vous pouvez également choisir de reporter ce montant sous forme d'avoir avec une <strong>remise de fidélité de 10%</strong> sur le circuit de votre choix.
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Toute l'équipe de TravelPlan vous présente ses plus sincères excuses pour la gêne occasionnée. Notre équipe reste à votre entière disposition par téléphone ou par email pour vous accompagner.
      </p>
    </div>
    <div class="footer">
      <p><strong>Service Client & Relations Voyageurs TravelPlan</strong></p>
      <p>Avenue Habib Bourguiba, Tunis · (+216) 71 000 000 · ${fromEmail}</p>
    </div>
  </div>
</body>
</html>
  `

  const textContent = `
TravelPlan — Annulation de Circuit
==================================================
Bonjour ${userPrenom} ${userNom},

Nous vous informons que le circuit "${tripTitle}" (${destinationName}) prévu du ${departureDate} au ${returnDate} a été annulé par l'agence.

RÉFÉRENCE : #${refCode}
STATUT : Annulée
PLACES : ${qty}
MONTANT : ${totalAmount} DT

REMBOURSEMENT :
Si un règlement a été effectué, il vous sera intégralement remboursé ou converti en avoir selon votre souhait.

Pour toute question, contactez notre équipe au (+216) 71 000 000 ou par email à ${fromEmail}.
  `

  try {
    const mailer = await getTransporter()
    console.log(`[Mailer] 📤 Envoi avis d'annulation à : ${recipientEmail}`)

    const info = await mailer.sendMail({
      from: fromHeader,
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
    })

    console.log(`[Mailer] ✅ Email d'annulation délivré à : ${recipientEmail} (MessageID: ${info.messageId})`)
    return { ok: true, messageId: info.messageId }
  } catch (error) {
    console.error(`[Mailer] ❌ Échec envoi annulation à ${recipientEmail} :`, error)
    return { ok: false, error: error.message }
  }
}

