import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { validateEmailStrict } from '../lib/emailValidator.js'

const router = Router()

// POST /api/contact — formulaire de contact public
router.post('/', async (req, res) => {
  const { name, nom, email, subject, sujet, message } = req.body
  const msgNom = (nom || name || '').trim()
  const msgSujet = (sujet || subject || '').trim()
  const msgEmail = (email || '').trim().toLowerCase()
  const msgContent = (message || '').trim()

  if (!msgNom || !msgEmail || !msgSujet || !msgContent) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires.' })
  }

  const emailValidation = await validateEmailStrict(msgEmail)
  if (!emailValidation.isValid) {
    return res.status(400).json({
      error: emailValidation.error,
      code: emailValidation.code || 'INVALID_EMAIL',
    })
  }

  const created = await prisma.message.create({
    data: {
      nom: msgNom,
      email: emailValidation.normalizedEmail,
      sujet: msgSujet,
      message: msgContent,
    },
  })

  res.status(201).json({
    id: created.id,
    name: created.nom,
    nom: created.nom,
    email: created.email,
    subject: created.sujet,
    sujet: created.sujet,
    message: created.message,
  })
})

export default router