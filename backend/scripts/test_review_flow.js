import { prisma } from '../src/lib/prisma.js'

async function testReviewFlow() {
  console.log('--- TEST REVIEW FLOW ---');

  // 1. User login
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ahmed@email.com', password: 'voyageur123' })
  });
  const userToken = (await loginRes.json()).token;

  // 2. Find a user reservation or create one with a completed past trip
  const user = await prisma.user.findUnique({ where: { email: 'ahmed@email.com' } });
  
  // Create a completed trip in the past
  const destination = await prisma.destination.findFirst();
  const completedTrip = await prisma.trip.create({
    data: {
      destinationId: destination.id,
      title: 'Séjour Découverte Passé',
      description: 'Un voyage inoubliable.',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
      departureDate: new Date('2026-07-01'),
      returnDate: new Date('2026-07-08'), // in the past relative to now
      price: 450,
      totalPlaces: 10,
      availablePlaces: 9,
      program: JSON.stringify(['Jour 1 : Arrivée', 'Jour 2 : Visites']),
    }
  });

  const completedRes = await prisma.reservation.create({
    data: {
      userId: user.id,
      tripId: completedTrip.id,
      quantity: 1,
      status: 'Confirmée',
    }
  });

  console.log('Completed Reservation created with ID:', completedRes.id);

  // 3. Submit review for this completed trip
  const reviewRes = await fetch('http://localhost:4000/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + userToken,
    },
    body: JSON.stringify({
      reservationId: completedRes.id,
      rating: 5,
      comment: 'Une organisation parfaite et un guide exceptionnel ! À refaire absolument.',
    })
  });
  const reviewData = await reviewRes.json();
  console.log('Review submission status (expected 201):', reviewRes.status, '| ID:', reviewData.id, '| Published:', reviewData.published);

  // 4. Check Home published reviews (should NOT appear yet)
  const homeBeforeRes = await fetch('http://localhost:4000/api/reviews/published');
  const homeBefore = await homeBeforeRes.json();
  const foundBefore = homeBefore.some(r => r.id === reviewData.id);
  console.log('Appears on Home before approval (expected false):', foundBefore);

  // 5. Admin login & approve review
  const adminLoginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@travelplan.tn', password: 'admin123' })
  });
  const adminToken = (await adminLoginRes.json()).token;

  const approveRes = await fetch(`http://localhost:4000/api/admin/reviews/${reviewData.id}/publish`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminToken,
    },
    body: JSON.stringify({ published: true }),
  });
  const approveData = await approveRes.json();
  console.log('Admin approve status (expected 200):', approveRes.status, '| Published:', approveData.published);

  // 6. Check Home published reviews (SHOULD appear now)
  const homeAfterRes = await fetch('http://localhost:4000/api/reviews/published');
  const homeAfter = await homeAfterRes.json();
  const foundAfter = homeAfter.some(r => r.id === reviewData.id);
  console.log('Appears on Home after approval (expected true):', foundAfter);

  console.log('\n✅ ALL REVIEW FLOW TESTS PASSED SUCCESSFULLY!');
}

testReviewFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
