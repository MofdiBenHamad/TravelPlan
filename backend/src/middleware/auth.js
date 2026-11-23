import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

// Vérifie le token JWT envoyé dans le header "Authorization: Bearer <token>"
// et attache l'utilisateur courant à req.user.
export async function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Authentification requise.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable.' })
    }
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré.' })
  }
}

// À utiliser après authRequired : bloque l'accès aux routes réservées à l'ADMIN
// (gestion des voyages, participants, paiements — cf. cahier des charges section 21).
export function adminOnly(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès réservé à l’administrateur.' })
  }
  next()
}
