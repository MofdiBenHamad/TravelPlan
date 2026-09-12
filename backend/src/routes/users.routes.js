import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { validateEmailStrict } from '../lib/emailValidator.js'

const router = Router()

function toPublicUser(user) {
  if (!user) return null
  const { password, ...rest } = user
  return {
    ...rest,
    prenom: user.prenom,
    nom: user.nom,
    firstName: user.prenom,
    lastName: user.nom,
  }
}

// PUT /api/users/me — modification du profil
router.put('/me', authRequired, async (req, res) => {
  const { prenom, nom, firstName, lastName, email } = req.body

  let normalizedEmail = req.user.email
  if (email && email.trim().toLowerCase() !== req.user.email.toLowerCase()) {
    const emailValidation = await validateEmailStrict(email)
    if (!emailValidation.isValid) {
      return res.status(400).json({
        error: emailValidation.error,
        code: emailValidation.code || 'INVALID_EMAIL',
      })
    }
    normalizedEmail = emailValidation.normalizedEmail

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé par un autre compte.' })
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      prenom: prenom !== undefined ? prenom.trim() : (firstName !== undefined ? firstName.trim() : req.user.prenom),
      nom: nom !== undefined ? nom.trim() : (lastName !== undefined ? lastName.trim() : req.user.nom),
      email: normalizedEmail,
    },
  })

  res.json({ user: toPublicUser(user) })
})

export default router