import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Shell } from "./components/layout/Shell";

import Home from "./pages/public/Home";
import Services from "./pages/public/Services";
import Book from "./pages/public/Book";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminAvailability from "./pages/admin/AdminAvailability";
import AdminBookings from "./pages/admin/AdminBookings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Shell><Home /></Shell>} />
      <Route path="/services" element={<Shell><Services /></Shell>} />
      <Route path="/book" element={<Shell><Book /></Shell>} />

      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Simple admin shell (you can wrap these in your admin guard if you already have one) */}
      <Route path="/admin" element={<Navigate to="/admin/availability" replace />} />
      <Route path="/admin/availability" element={<div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex justify-between">
          <Link className="text-sm text-muted hover:text-text" to="/">← back</Link>
          <Link className="text-sm text-muted hover:text-text" to="/admin/bookings">Bookings →</Link>
        </div>
        <AdminAvailability />
      </div>} />
      <Route path="/admin/bookings" element={<div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex justify-between">
          <Link className="text-sm text-muted hover:text-text" to="/">← back</Link>
          <Link className="text-sm text-muted hover:text-text" to="/admin/availability">Availability →</Link>
        </div>
        <AdminBookings />
      </div>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
