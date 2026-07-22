import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminRoute from "./components/AdminRoute";
import ChatWidget from "./components/ChatWidget";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import PriceCalendar from "./pages/PriceCalendar";
import Everywhere from "./pages/Everywhere";
import Redirect from "./pages/Redirect";
import Alerts from "./pages/Alerts";
import Hotels from "./pages/Hotels";
import HotelResults from "./pages/HotelResults";
import HotelDetail from "./pages/HotelDetail";
import HotelConfirmation from "./pages/HotelConfirmation";
import HotelBookings from "./pages/HotelBookings";
import Cabs from "./pages/Cabs";
import CabEstimate from "./pages/CabEstimate";
import CabConfirmation from "./pages/CabConfirmation";
import CabBookings from "./pages/CabBookings";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen flex-col bg-sand-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/calendar" element={<PriceCalendar />} />
              <Route path="/everywhere" element={<Everywhere />} />
              <Route path="/redirect/:offerId" element={<Redirect />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/hotels" element={<Hotels />} />
              <Route path="/hotels/results" element={<HotelResults />} />
              <Route path="/hotels/bookings" element={<HotelBookings />} />
              <Route path="/hotels/confirmation/:bookingId" element={<HotelConfirmation />} />
              <Route path="/hotels/:hotelId" element={<HotelDetail />} />
              <Route path="/cabs" element={<Cabs />} />
              <Route path="/cabs/estimate" element={<CabEstimate />} />
              <Route path="/cabs/bookings" element={<CabBookings />} />
              <Route path="/cabs/confirmation/:bookingId" element={<CabConfirmation />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </main>
          <Footer />
          <ChatWidget />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
