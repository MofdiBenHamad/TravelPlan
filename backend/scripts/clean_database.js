import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

async function cleanDatabase() {
  console.log('====================================================')
  console.log('🧹 NETTOYAGE DE LA BASE DE DONNÉES TRAVELPLAN')
  console.log('====================================================\n')

  const adminPassword = await bcrypt.hash('admin123', 10)
  const ahmedPassword = await bcrypt.hash('voyageur123', 10)

  // 1. S'assurer que le compte Admin existe et est vérifié
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@travelplan.tn' },
    update: {
      role: 'ADMIN',
      is_verified: true,
      password: adminPassword,
    },
    create: {
      prenom: 'Admin',
      nom: 'TravelPlan',
      email: 'admin@travelplan.tn',
      password: adminPassword,
      role: 'ADMIN',
      is_verified: true,
    },
  })
  console.log(`✅ Compte Administrateur conservé : ${adminUser.email} (is_verified: ${adminUser.is_verified})`)

  // 2. S'assurer que le compte Ahmed existe et est vérifié
  const ahmedUser = await prisma.user.upsert({
    where: { email: 'ahmed@email.com' },
    update: {
      role: 'VOYAGEUR',
      is_verified: true,
      password: ahmedPassword,
    },
    create: {
      prenom: 'Ahmed',
      nom: 'Ben Ali',
      email: 'ahmed@email.com',
      password: ahmedPassword,
      role: 'VOYAGEUR',
      is_verified: true,
    },
  })
  console.log(`✅ Compte Voyageur Ahmed conservé : ${ahmedUser.email} (is_verified: ${ahmedUser.is_verified})`)

  const preservedIds = [adminUser.id, ahmedUser.id]

  // 3. Trouver les autres utilisateurs à supprimer
  const usersToDelete = await prisma.user.findMany({
    where: {
      id: { notIn: preservedIds },
    },
    select: { id: true, email: true, prenom: true, nom: true },
  })

  console.log(`\n🔍 ${usersToDelete.length} autre(s) utilisateur(s) trouvé(s) à supprimer :`)
  usersToDelete.forEach((u) => console.log(`  - ${u.prenom} ${u.nom} (${u.email}) [ID: ${u.id}]`))

  const toDeleteIds = usersToDelete.map((u) => u.id)

  if (toDeleteIds.length > 0) {
    // Supprimer les paiements liés aux réservations de ces utilisateurs
    const resOfDeleted = await prisma.reservation.findMany({
      where: { user_id: { in: toDeleteIds } },
      select: { id: true },
    })
    const resIds = resOfDeleted.map((r) => r.id)

    if (resIds.length > 0) {
      await prisma.paiement.deleteMany({
        where: { reservation_id: { in: resIds } },
      })
      await prisma.avis.deleteMany({
        where: { reservation_id: { in: resIds } },
      })
      await prisma.reservation.deleteMany({
        where: { id: { in: resIds } },
      })
    }

    // Supprimer les avis directs de ces utilisateurs
    await prisma.avis.deleteMany({
      where: { user_id: { in: toDeleteIds } },
    })

    // Supprimer les utilisateurs
    const deleted = await prisma.user.deleteMany({
      where: { id: { in: toDeleteIds } },
    })
    console.log(`\n🗑️ ${deleted.count} utilisateur(s) supprimé(s) avec succès.`)
  } else {
    console.log('\n✨ Aucun autre utilisateur à supprimer.')
  }

  // 4. Afficher l'état final des utilisateurs en base
  const finalUsers = await prisma.user.findMany({
    select: { id: true, email: true, prenom: true, nom: true, role: true, is_verified: true },
  })
  console.log('\n📋 Utilisateurs finaux présents dans la base :')
  finalUsers.forEach((u) => console.log(`  • ${u.prenom} ${u.nom} (${u.email}) - Rôle: ${u.role} - Vérifié: ${u.is_verified}`))

  console.log('\n====================================================')
  console.log('✅ NETTOYAGE TERMINÉ AVEC SUCCÈS !')
  console.log('====================================================')
}

cleanDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
