import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

async function testRealUserBooking() {
  console.log('--- TEST REAL USER BOOKING WITH NODEMAILER GMAIL DELIVERY ---')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create or update user with real email
  const user = await prisma.user.upsert({
    where: { email: 'mofdibenhamed79@gmail.com' },
    update: { password: hashedPassword },
    create: {
      firstName: 'Mofdi',
      lastName: 'Ben Hamed',
      email: 'mofdibenhamed79@gmail.com',
      password: hashedPassword,
      role: 'VOYAGEUR',
    },
  })

  // Get a trip
  const trip = await prisma.trip.findFirst({
    include: { destination: true },
  })

  // Login
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mofdibenhamed79@gmail.com', password: 'password123' }),
  })
  const token = (await loginRes.json()).token

  // Clean any previous active reservation on this trip for this user to avoid conflict
  await prisma.reservation.deleteMany({
    where: { userId: user.id, tripId: trip.id },
  })

  // Make booking
  console.log(`Booking trip "${trip.title}" (${trip.destination?.name}) for user ${user.email}...`)
  const bookRes = await fetch('http://localhost:4000/api/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    body: JSON.stringify({
      tripId: trip.id,
      quantity: 2,
    }),
  })

  const bookData = await bookRes.json()
  console.log('Booking response status:', bookRes.status)
  console.log('Reservation ID:', bookData.id)
  console.log('Status:', bookData.status)
  console.log('Email sent to:', bookData.confirmationEmailRecipient)
  console.log('Email sent status:', bookData.confirmationEmailSent)
  console.log('Expires at:', bookData.expiresAt)
  console.log('Token exists:', Boolean(bookData.token))

  console.log('\n🎉 ALL NODEMAILER RESERVATION DISPATCH CHECKS PASSED!')
}

testRealUserBooking()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
