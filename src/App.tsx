import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SiteShell } from "./components/site/layout/SiteShell";
import { SiteSeo } from "./components/site/Seo";

const Home = lazy(() => import("./pages/public/Home"));
const Services = lazy(() => import("./pages/public/Services"));
const ServiceDetail = lazy(() => import("./pages/public/ServiceDetail"));
const Gallery = lazy(() => import("./pages/public/Gallery"));
const About = lazy(() => import("./pages/public/About"));
const Book = lazy(() => import("./pages/public/Book"));
const Contact = lazy(() => import("./pages/public/Contact"));
const Privacy = lazy(() => import("./pages/public/Privacy"));
const Cookies = lazy(() => import("./pages/public/Cookies"));
const Terms = lazy(() => import("./pages/public/Terms"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminWorkspace = lazy(() => import("./pages/admin/AdminWorkspace"));
const AdminGate = lazy(() => import("./pages/admin/AdminGate"));
const ServiceEditor = lazy(() => import("./pages/admin/ServiceEditor"));

function PageFallback() {
  return <div className="min-h-[50vh]" aria-hidden="true" />;
}

function AdminFrame({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageFallback />}>
      <div className="admin min-h-[100svh]">
        <SiteSeo title="Admin" path="/admin" noIndex description="Studio admin" shareTitle="Admin | DDS" />
        {children}
      </div>
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteShell />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<PageFallback />}>
              <Home />
            </Suspense>
          }
        />
        <Route
          path="/services"
          element={
            <Suspense fallback={<PageFallback />}>
              <Services />
            </Suspense>
          }
        />
        <Route
          path="/services/:slug"
          element={
            <Suspense fallback={<PageFallback />}>
              <ServiceDetail />
            </Suspense>
          }
        />
        <Route
          path="/gallery"
          element={
            <Suspense fallback={<PageFallback />}>
              <Gallery />
            </Suspense>
          }
        />
        <Route
          path="/about"
          element={
            <Suspense fallback={<PageFallback />}>
              <About />
            </Suspense>
          }
        />
        <Route
          path="/book"
          element={
            <Suspense fallback={<PageFallback />}>
              <Book />
            </Suspense>
          }
        />
        <Route
          path="/contact"
          element={
            <Suspense fallback={<PageFallback />}>
              <Contact />
            </Suspense>
          }
        />
        <Route
          path="/privacy"
          element={
            <Suspense fallback={<PageFallback />}>
              <Privacy />
            </Suspense>
          }
        />
        <Route
          path="/cookies"
          element={
            <Suspense fallback={<PageFallback />}>
              <Cookies />
            </Suspense>
          }
        />
        <Route
          path="/terms"
          element={
            <Suspense fallback={<PageFallback />}>
              <Terms />
            </Suspense>
          }
        />
        <Route path="/interior" element={<Navigate to="/gallery" replace />} />
        <Route path="/paint" element={<Navigate to="/gallery" replace />} />
        <Route path="/glass" element={<Navigate to="/gallery" replace />} />
      </Route>

      <Route
        path="/admin/login"
        element={
          <AdminFrame>
            <AdminLogin />
          </AdminFrame>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminFrame>
            <AdminGate>
              <AdminWorkspace />
            </AdminGate>
          </AdminFrame>
        }
      />
      <Route
        path="/admin/services/new"
        element={
          <AdminFrame>
            <AdminGate>
              <ServiceEditor />
            </AdminGate>
          </AdminFrame>
        }
      />
      <Route
        path="/admin/services/:id"
        element={
          <AdminFrame>
            <AdminGate>
              <ServiceEditor />
            </AdminGate>
          </AdminFrame>
        }
      />
      <Route path="/admin/services" element={<Navigate to="/admin?tab=services" replace />} />
      <Route path="/admin/availability" element={<Navigate to="/admin?tab=hours" replace />} />
      <Route path="/admin/bookings" element={<Navigate to="/admin?tab=bookings" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
