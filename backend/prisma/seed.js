import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const voyagesData = [
  // Paris
  {
    destination: 'Paris, France',
    titre: 'Paris Découverte & Musées',
    description: 'Cinq jours pour explorer les incontournables : Tour Eiffel, Louvre, Montmartre et croisière sur la Seine.',
    date_de_depart: new Date('2026-09-15'),
    date_de_retour: new Date('2026-09-20'),
    prix: 500,
    nb_total: 20,
    nb_disponible: 20,
    programme: JSON.stringify([
      'Jour 1 : Arrivée, installation à l\'hôtel et coucher de soleil à la Tour Eiffel',
      'Jour 2 : Visite guidée du Musée du Louvre et jardins des Tuileries',
      'Jour 3 : Quartier Montmartre, Basilique du Sacré-Cœur et place du Tertre',
      'Jour 4 : Croisière commentée sur la Seine et shopping aux Champs-Élysées',
      'Jour 5 : Matinée libre au Quartier Latin et transfert retour',
    ]),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=80',
      'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=1200&q=80',
    ]),
    statut: 'ACTIVE',
  },
  {
    destination: 'Paris, France',
    titre: 'Paris Romantique & Gastronomie',
    description: 'Un séjour de charme de 4 jours axé sur les expériences culinaires, dîner-croisière et bistros parisiens.',
    date_de_depart: new Date('2026-10-10'),
    date_de_retour: new Date('2026-10-14'),
    prix: 680,
    nb_total: 15,
    nb_disponible: 15,
    programme: JSON.stringify([
      'Jour 1 : Accueil avec champagne, balade sur l\'Île Saint-Louis',
      'Jour 2 : Dégustation pâtisserie française et visite du Marais',
      'Jour 3 : Dîner gastronomique en croisière sur la Seine',
      'Jour 4 : Découverte des passages couverts et départ',
    ]),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1509299349698-dd22323b5963?w=1200&q=80',
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1200&q=80',
    ]),
    statut: 'ACTIVE',
  },
  {
    destination: 'Paris, France',
    titre: 'Week-end Express Tour Eiffel',
    description: 'Une escapade intense de 3 jours pour voir le meilleur de Paris en un temps record.',
    date_de_depart: new Date('2026-10-24'),
    date_de_retour: new Date('2026-10-27'),
    prix: 350,
    nb_total: 25,
    nb_disponible: 25,
    programme: JSON.stringify([
      'Jour 1 : Arrivée matinale et tour panoramique en bus à impériale',
      'Jour 2 : Ascension Tour Eiffel et après-midi shopping',
      'Jour 3 : Balade à Notre-Dame et retour',
    ]),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=1200&q=80',
    ]),
    statut: 'ACTIVE',
  },

  // Djerba
  {
    destination: 'Djerba, Tunisie',
    titre: 'Djerba Soleil & Séjour Balnéaire',
    description: 'Cinq jours de détente tout confort dans un hôtel en bord de mer avec activités nautiques et marchés artisanaux.',
    date_de_depart: new Date('2026-09-05'),
    date_de_retour: new Date('2026-09-10'),
    prix: 350,
    nb_total: 30,
    nb_disponible: 30,
    programme: JSON.stringify([
      'Jour 1 : Arrivée, transfert et cocktail de bienvenue',
      'Jour 2 : Journée farniente à la plage et activités nautiques',
      'Jour 3 : Visite du marché de Houmt Souk et de Guellala (poterie)',
      'Jour 4 : Excursion en bateau pirate vers l\'île aux Flamants Roses',
      'Jour 5 : Matinée libre et départ',
    ]),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80',
    ]),
    statut: 'ACTIVE',
  },
  {
    destination: 'Djerba, Tunisie',
    titre: 'Djerba Aventure & Safari Désert',
    description: 'Quatre jours combinant séjour sur l\'île et excursion en 4x4 vers les portes du Sahara tunisien (Ksar Ghilane).',
    date_de_depart: new Date('2026-09-18'),
    date_de_retour: new Date('2026-09-22'),
    prix: 420,
    nb_total: 20,
    nb_disponible: 20,
    programme: JSON.stringify([
      'Jour 1 : Arrivée à Djerba et tour de l\'île en quad',
      'Jour 2 : Départ en 4x4 vers Tataouine et Ksar Ouled Soltane',
      'Jour 3 : Nuit sous tente berbère à Ksar Ghilane et baignade dans la source chaude',
      'Jour 4 : Retour à Djerba via la chaussée romaine et départ',
    ]),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80',
    ]),
    statut: 'ACTIVE',
  },

  // Rome
  {
    destination: 'Rome, Italie',
    titre: 'Escapade Historique à Rome',
    description: 'Cinq jours pour revivre l\'Empire Romain : Colisée, Forum Romain, Panthéon et Fontaine de Trevi.',
    date_de_depart: new Date('2026-10-02'),
    date_de_retour: new Date('2026-10-07'),
    prix: 620,
    nb_total: 18,
    nb_disponible: 18,
    programme: JSON.stringify([
      'Jour 1 : Arrivée, installation et première balade vers la Fontaine de Trevi',
      'Jour 2 : Visite complète du Colisée, Palatin et Forum Romain',
      'Jour 3 : Panthéon, Place Navone et dégustation de glaces artisanales',
      'Jour 4 : Journée libre pour flâner à Trastevere et shopping',
      'Jour 5 : Derniers achats et transfert vers l\'aéroport',
    ]),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=1200&q=80',
    ]),
    statut: 'ACTIVE',
  },
  {
    destination: 'Rome, Italie',
    titre: 'Rome & Cité du Vatican Privilège',
    description: 'Six jours avec accès coupe-file aux Musées du Vatican, Chapelle Sixtine et Basilique Saint-Pierre.',
    date_de_depart: new Date('2026-11-05'),
    date_de_retour: new Date('2026-11-11'),
    prix: 750,
    nb_total: 16,
    nb_disponible: 16,
    programme: JSON.stringify([
      'Jour 1 : Arrivée et cocktail de bienvenue',
      'Jour 2 : Visite privée des Musées du Vatican et Chapelle Sixtine',
      'Jour 3 : Basilique Saint-Pierre et Château Saint-Ange',
      'Jour 4 : Rome antique : Colisée et Forum',
      'Jour 5 : Villa Borghese et jardins',
      'Jour 6 : Départ',
    ]),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=1200&q=80',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80',
    ]),
    statut: 'ACTIVE',
  },

  // Istanbul
  {
    destination: 'Istanbul, Turquie',
    titre: 'Istanbul Magique : Bosphore & Palais',
    description: 'Cinq jours magiques entre Sainte-Sophie, la Mosquée Bleue, le Palais de Topkapi et une croisière sur le Bosphore.',
    date_de_depart: new Date('2026-10-15'),
    date_de_retour: new Date('2026-10-20'),
    prix: 580,
    nb_total: 22,
    nb_disponible: 22,
    programme: JSON.stringify([
      'Jour 1 : Arrivée et dîner panoramique vue sur la Corne d\'Or',
      'Jour 2 : Sainte-Sophie, Mosquée Bleue et Citerne Basilique',
      'Jour 3 : Palais de Topkapi et croisière privée sur le Bosphore',
      'Jour 4 : Grand Bazar et Bazar Égyptien (épices)',
      'Jour 5 : Quartier de Galata et retour',
    ]),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=80',
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&q=80',
    ]),
    statut: 'ACTIVE',
  },
  {
    destination: 'Istanbul, Turquie',
    titre: 'Istanbul Shopping & Culture Grand Bazar',
    description: 'Quatre jours pour profiter du shopping textile, des marchés d\'artisanat et des bains turcs traditionnels.',
    date_de_depart: new Date('2026-11-12'),
    date_de_retour: new Date('2026-11-16'),
    prix: 450,
    nb_total: 20,
    nb_disponible: 20,
    programme: JSON.stringify([
      'Jour 1 : Arrivée et immersion dans l\'avenue Istiklal',
      'Jour 2 : Journée dédiée au Grand Bazar et Marché aux Épices',
      'Jour 3 : Détente dans un hammam historique et croisière coucher de soleil',
      'Jour 4 : Matinée libre et transfert retour',
    ]),
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&q=80',
    ]),
    statut: 'ACTIVE',
  },
]

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  const voyageurPassword = await bcrypt.hash('voyageur123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@travelplan.tn' },
    update: { nom: 'TravelPlan', prenom: 'Admin', role: 'ADMIN', is_verified: true },
    create: {
      prenom: 'Admin',
      nom: 'TravelPlan',
      email: 'admin@travelplan.tn',
      password: adminPassword,
      role: 'ADMIN',
      is_verified: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'ahmed@email.com' },
    update: { nom: 'Ben Ali', prenom: 'Ahmed', role: 'VOYAGEUR', is_verified: true },
    create: {
      prenom: 'Ahmed',
      nom: 'Ben Ali',
      email: 'ahmed@email.com',
      password: voyageurPassword,
      role: 'VOYAGEUR',
      is_verified: true,
    },
  })

  for (const voyage of voyagesData) {
    await prisma.voyage.create({
      data: voyage,
    })
  }

  console.log('✅ Seed terminé avec succès (sans table destination) !')
  console.log('Comptes : admin@travelplan.tn / admin123, ahmed@email.com / voyageur123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())