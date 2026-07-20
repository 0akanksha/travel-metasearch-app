import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminRoute from "./components/AdminRoute";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import PriceCalendar from "./pages/PriceCalendar";
import Everywhere from "./pages/Everywhere";
import BookingPage from "./pages/BookingPage";
import BookingSuccess from "./pages/BookingSuccess";
import ManageBooking from "./pages/ManageBooking";
import Alerts from "./pages/Alerts";
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
              <Route path="/book/:offerId" element={<BookingPage />} />
              <Route path="/booking/success" element={<BookingSuccess />} />
              <Route path="/manage" element={<ManageBooking />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
