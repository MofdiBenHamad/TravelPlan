import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.routes.js'
import destinationsRoutes from './routes/destinations.routes.js'
import tripsRoutes from './routes/trips.routes.js'
import reservationsRoutes from './routes/reservations.routes.js'
import paymentsRoutes from './routes/payments.routes.js'
import usersRoutes from './routes/users.routes.js'
import adminRoutes from './routes/admin.routes.js'
import contactRoutes from './routes/contact.routes.js'
import reviewsRoutes from './routes/reviews.routes.js'

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ limit: '20mb', extended: true }))

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/destinations', destinationsRoutes)
app.use('/api/trips', tripsRoutes)
app.use('/api/reservations', reservationsRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/reviews', reviewsRoutes)

// Endpoint de diagnostic et test d'envoi d'email
app.all('/api/test-email', async (req, res) => {
  const targetEmail = req.query.to || req.body.to || process.env.EMAIL_USER || 'mofdibenhamed79@gmail.com'
  const { sendReservationConfirmationEmail } = await import('./lib/mailer.js')

  const result = await sendReservationConfirmationEmail({
    user: { firstName: 'Mofdi (Test)', lastName: 'Ben Hamed', email: targetEmail },
    trip: {
      title: 'Circuit Test Diagnostic SMTP',
      destination: { name: 'Tunis, Tunisie' },
      departureDate: new Date('2026-10-01'),
      returnDate: new Date('2026-10-07'),
      price: 650,
    },
    reservation: { id: 'diag-' + Date.now().toString(36), quantity: 1 },
    total: 650,
  })

  if (result.ok) {
    res.json({
      success: true,
      message: `Email de test envoyé avec succès à ${targetEmail}`,
      details: result,
    })
  } else {
    res.status(500).json({
      success: false,
      message: `Échec d'envoi de l'email à ${targetEmail}`,
      error: result.error,
      code: result.code,
      details: result.details,
    })
  }
})

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Erreur serveur interne.' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, async () => {
  console.log(`TravelPlan API démarrée sur http://localhost:${PORT}`)

  // Vérification de la connexion SMTP au démarrage
  try {
    const { createAndVerifyTransporter } = await import('./lib/mailer.js')
    await createAndVerifyTransporter()
  } catch (err) {
    console.error('[Mailer Startup] ❌ Erreur lors de l\'initialisation SMTP :', err)
  }
})