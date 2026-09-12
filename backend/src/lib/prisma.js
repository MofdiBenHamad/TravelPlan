import { PrismaClient } from '@prisma/client'

// Instance unique réutilisée dans toute l'application (évite d'ouvrir
// une nouvelle connexion à chaque requête, surtout en dev avec nodemon).
export const prisma = new PrismaClient()