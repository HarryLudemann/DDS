import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Page } from "../../components/layout/Page";

export default function AdminHome() {
  return (
    <Page>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 truncate">Admin</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage availability and bookings.
            </p>
          </div>

          <Link to="/">
            <Button variant="secondary">Back to site</Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-6 space-y-3">
            <div className="text-sm font-extrabold text-slate-900">Packages</div>
            <div className="text-sm text-slate-600">
              Edit package names, pricing, and inclusions.
            </div>
            <Link to="/admin/packages">
              <Button className="mt-2">Edit packages</Button>
            </Link>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="text-sm font-extrabold text-slate-900">Services</div>
            <div className="text-sm text-slate-600">
              Set service durations (controls booking availability).
            </div>
            <Link to="/admin/services">
              <Button className="mt-2" variant="secondary">
                Edit services
              </Button>
            </Link>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="text-sm font-extrabold text-slate-900">Availability</div>
            <div className="text-sm text-slate-600">
              Set weekly working hours (e.g. Sat/Sun 8–5).
            </div>
            <Link to="/admin/availability">
              <Button className="mt-2" variant="secondary">
                Edit availability
              </Button>
            </Link>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="text-sm font-extrabold text-slate-900">Bookings</div>
            <div className="text-sm text-slate-600">
              View upcoming bookings + customer details.
            </div>
            <Link to="/admin/bookings">
              <Button className="mt-2" variant="secondary">
                View bookings
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </Page>
  );
}
