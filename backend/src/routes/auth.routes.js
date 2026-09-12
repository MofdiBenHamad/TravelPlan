import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
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

function signToken(user) {
  return jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret_travelplan', { expiresIn: '7d' })
}

// POST /api/auth/register — Inscription directe et connexion immédiate
router.post('/register', async (req, res) => {
  const { prenom, nom, firstName, lastName, email, password } = req.body

  const userPrenom = (prenom || firstName || '').trim()
  const userNom = (nom || lastName || '').trim()

  if (!userPrenom || !userNom || !email || !password) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' })
  }

  // Validation stricte de l'email (Format, domaine, MX)
  const emailValidation = await validateEmailStrict(email)
  if (!emailValidation.isValid) {
    return res.status(400).json({
      error: emailValidation.error,
      code: emailValidation.code || 'INVALID_EMAIL',
    })
  }

  const normalizedEmail = emailValidation.normalizedEmail
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' })
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      prenom: userPrenom,
      nom: userNom,
      email: normalizedEmail,
      password: hashed,
      role: 'VOYAGEUR',
      is_verified: true,
    },
  })

  const token = signToken(user)
  console.log(`[Auth Register] 👤 Compte créé : ${user.prenom} ${user.nom} (${user.email})`)

  res.status(201).json({
    token,
    user: toPublicUser(user),
  })
})

// POST /api/auth/login — Connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Veuillez renseigner votre adresse email et votre mot de passe.' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) {
    return res.status(404).json({
      error: "Cette adresse email n'existe pas dans notre base de données. Veuillez vérifier votre saisie ou créer un compte.",
      code: 'EMAIL_NOT_FOUND',
    })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return res.status(401).json({
      error: 'Mot de passe incorrect. Veuillez réessayer.',
      code: 'INVALID_PASSWORD',
    })
  }

  // Vérification de la confirmation de l'email
  if (user.is_verified === false) {
    return res.status(403).json({
      error: 'Veuillez confirmer votre adresse e-mail avant de vous connecter.',
      code: 'EMAIL_NOT_VERIFIED',
    })
  }

  const token = signToken(user)
  res.json({ token, user: toPublicUser(user) })
})

// GET /api/auth/me — Restaure la session
router.get('/me', authRequired, async (req, res) => {
  res.json({ user: toPublicUser(req.user) })
})

export default router