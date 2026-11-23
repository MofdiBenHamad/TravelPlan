import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import AdminProtectedRoute from './components/AdminRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

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
    <Routes>
      {/* ========================================================
          LAYOUT UNIFIÉ (MainLayout) :
          Partagé par les Voyageurs et les Administrateurs.
          Même Navbar supérieure, même Footer, mêmes cartes & design.
          ======================================================== */}
      <Route element={<MainLayout />}>
        {/* ---- 1. Routes Publiques & Voyageurs ---- */}
        <Route path="/" element={<Home />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Register />} />
        <Route path="/voyages" element={<Trips />} />
        <Route path="/voyages/:id" element={<TripDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/confirmer-reservation" element={<ConfirmReservation />} />
        <Route path="/verifier-email" element={<VerifyEmail />} />

        {/* ---- Routes Voyageurs Protégées ---- */}
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

        {/* ---- 2. Routes Administrateur Protégées (/admin/*) ---- */}
        <Route path="/admin" element={<AdminProtectedRoute />}>
          <Route index element={<Navigate to="/admin/statistiques" replace />} />
          <Route path="statistiques" element={<AdminDashboard />} />
          <Route path="voyages" element={<AdminTrips />} />
          <Route path="reservations" element={<AdminPayments />} />
          <Route path="participants" element={<AdminParticipants />} />
          <Route path="transactions" element={<AdminPayments />} />
          <Route path="paiements" element={<AdminPayments />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="avis" element={<AdminReviews />} />
        </Route>

        {/* ---- Page Introuvable (404) ---- */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
