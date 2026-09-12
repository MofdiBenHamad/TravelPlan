import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import LoginModal from './components/LoginModal.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'

import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Trips from './pages/Trips.jsx'
import TripDetails from './pages/TripDetails.jsx'
import Reservation from './pages/Reservation.jsx'
import Payment from './pages/Payment.jsx'
import MyReservations from './pages/MyReservations.jsx'
import Profile from './pages/Profile.jsx'
import Contact from './pages/Contact.jsx'
import About from './pages/About.jsx'
import ConfirmReservation from './pages/ConfirmReservation.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import NotFound from './pages/NotFound.jsx'

import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminTrips from './pages/admin/AdminTrips.jsx'
import AdminParticipants from './pages/admin/AdminParticipants.jsx'
import AdminPayments from './pages/admin/AdminPayments.jsx'
import AdminMessages from './pages/admin/AdminMessages.jsx'
import AdminReviews from './pages/admin/AdminReviews.jsx'

import './App.css'

export default function App() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Navbar />
      <LoginModal />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/voyages" element={<Trips />} />
          <Route path="/voyages/:id" element={<TripDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/confirmer-reservation" element={<ConfirmReservation />} />
          <Route path="/verifier-email" element={<VerifyEmail />} />

          <Route
            path="/voyages/:id/reserver"
            element={
              <ProtectedRoute role="VOYAGEUR">
                <Reservation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paiement/:reservationId"
            element={
              <ProtectedRoute role="VOYAGEUR">
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mes-reservations"
            element={
              <ProtectedRoute role="VOYAGEUR">
                <MyReservations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profil"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/voyages"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminTrips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/participants"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminParticipants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/paiements"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/messages"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/avis"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminReviews />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}