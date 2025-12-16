import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Shell } from "./components/layout/Shell";

import Home from "./pages/public/Home";
import Services from "./pages/public/Services";
import Book from "./pages/public/Book";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminGate from "./pages/admin/AdminGate";
import AdminHome from "./pages/admin/AdminHome";
import AdminAvailability from "./pages/admin/AdminAvailability";
import AdminBookings from "./pages/admin/AdminBookings";

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/book" element={<Book />} />

          {/* Admin login route */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected admin routes */}
          <Route
            path="/admin"
            element={
              <AdminGate>
                <AdminHome />
              </AdminGate>
            }
          />
          <Route
            path="/admin/availability"
            element={
              <AdminGate>
                <AdminAvailability />
              </AdminGate>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <AdminGate>
                <AdminBookings />
              </AdminGate>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
