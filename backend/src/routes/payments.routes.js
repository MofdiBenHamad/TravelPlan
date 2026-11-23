import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// POST /api/payments — Le paiement par carte en ligne est désactivé.
// Les transactions sont finalisées directement via les instructions envoyées par email.
router.post('/', authRequired, async (req, res) => {
  return res.status(400).json({
    error: 'Le paiement en ligne est actuellement indisponible. Un email de confirmation contenant les instructions pour finaliser votre transaction vous a été envoyé.',
    isPaymentDisabled: true,
  })
})

export default router
