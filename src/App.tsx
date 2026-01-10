import { Routes, Route, Navigate } from "react-router-dom";
import { Shell } from "./components/layout/Shell";

import Home from "./pages/public/Home";
import Book from "./pages/public/Book";
import Interior from "./pages/public/Interior";
import Paint from "./pages/public/Paint";
import Glass from "./pages/public/Glass";
import Privacy from "./pages/public/Privacy";
import Cookies from "./pages/public/Cookies";
import Terms from "./pages/public/Terms";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminGate from "./pages/admin/AdminGate";
import AdminHome from "./pages/admin/AdminHome";
import AdminServices from "./pages/admin/AdminServices";
import AdminAvailability from "./pages/admin/AdminAvailability";
import AdminBookings from "./pages/admin/AdminBookings";


export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<Book />} />
        <Route path="/interior" element={<Interior />} />
        <Route path="/paint" element={<Paint />} />
        <Route path="/glass" element={<Glass />} />

        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/terms" element={<Terms />} />

        <Route
          path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <AdminGate>
              <AdminHome />
            </AdminGate>
          }
        />
        <Route
          path="/admin/services"
          element={
            <AdminGate>
              <AdminServices />
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
  );
}
