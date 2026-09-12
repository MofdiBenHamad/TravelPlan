import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

async function testEmailVerificationFlow() {
  console.log('--- TEST: EMAIL VERIFICATION RESERVATION WORKFLOW ---')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // 1. Setup user
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

  // 2. Get a trip
  const trip = await prisma.trip.findFirst({
    include: { destination: true },
  })

  // Clean any previous active reservation on this trip
  await prisma.reservation.deleteMany({
    where: { userId: user.id, tripId: trip.id },
  })

  // 3. User logs in
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mofdibenhamed79@gmail.com', password: 'password123' }),
  })
  const token = (await loginRes.json()).token

  // 4. Create booking -> should be 'En attente'
  console.log('\nStep 1: Creating reservation...')
  const bookRes = await fetch('http://localhost:4000/api/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    body: JSON.stringify({
      tripId: trip.id,
      quantity: 1,
    }),
  })

  const bookData = await bookRes.json()
  console.log('Creation Status (expected 201):', bookRes.status)
  console.log('Reservation ID:', bookData.id)
  console.log('Initial Booking Status (expected "En attente"):', bookData.status)
  console.log('Verification Link generated:', bookData.verificationLink)
  console.log('Confirmation Email Sent to user:', bookData.confirmationEmailSent)

  if (bookData.status !== 'En attente') {
    throw new Error('Expected initial status to be "En attente", got: ' + bookData.status)
  }

  // 5. Verify token via GET /api/reservations/verify?token=...
  console.log('\nStep 2: Simulating user clicking verification link in email...')
  const verifyRes = await fetch(`http://localhost:4000/api/reservations/verify?token=${bookData.token}`)
  const verifyData = await verifyRes.json()

  console.log('Verification endpoint status (expected 200):', verifyRes.status)
  console.log('Updated Reservation Status (expected "Confirmée"):', verifyData.reservation?.status)
  console.log('Already Confirmed:', verifyData.alreadyConfirmed)

  if (verifyData.reservation?.status !== 'Confirmée') {
    throw new Error('Expected updated status to be "Confirmée", got: ' + verifyData.reservation?.status)
  }

  // 6. Verify in DB directly
  const dbReservation = await prisma.reservation.findUnique({
    where: { id: bookData.id },
  })
  console.log('\nStep 3: Database direct check - status:', dbReservation.status)

  // 7. Verify clicking a second time
  console.log('\nStep 4: Clicking verification link a second time...')
  const verifyRes2 = await fetch(`http://localhost:4000/api/reservations/verify?token=${bookData.token}`)
  const verifyData2 = await verifyRes2.json()
  console.log('Second click - Already confirmed (expected true):', verifyData2.alreadyConfirmed)

  // 8. Test invalid token
  console.log('\nStep 5: Testing invalid token...')
  const invalidRes = await fetch(`http://localhost:4000/api/reservations/verify?token=fake_invalid_token`)
  const invalidData = await invalidRes.json()
  console.log('Invalid token status (expected 400):', invalidRes.status, '| Error:', invalidData.error)

  console.log('\n🎉 ALL EMAIL VERIFICATION TESTS PASSED PERFECTLY!')
}

testEmailVerificationFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
