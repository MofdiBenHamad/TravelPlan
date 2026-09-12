import { sendReservationConfirmationEmail } from '../src/lib/mailer.js'
import { prisma } from '../src/lib/prisma.js'

async function testConfirmationEmail() {
  console.log('Testing sendReservationConfirmationEmail...')
  const user = await prisma.user.findFirst()
  const voyage = await prisma.voyage.findFirst()
  const reservation = await prisma.reservation.findFirst()

  const result = await sendReservationConfirmationEmail({
    user: { ...user, email: 'mofdibenhamed79@gmail.com' },
    trip: voyage,
    reservation: reservation || { id: 'test_res_123', quantite: 2 },
    total: 700,
  })

  console.log('Confirmation email test result:', result)
}

testConfirmationEmail()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
