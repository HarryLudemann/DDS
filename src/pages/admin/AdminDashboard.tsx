import { Card } from "../../components/ui/Card";
import AdminShell from "./AdminShell";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-2 text-muted text-sm">Set availability and manage bookings.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <div className="font-medium">Availability</div>
            <p className="mt-2 text-sm text-muted">Create time slots customers can book.</p>
            <Link className="mt-4 inline-block text-sm text-brand hover:underline" to="/admin/availability">
              Manage →
            </Link>
          </Card>
          <Card>
            <div className="font-medium">Bookings</div>
            <p className="mt-2 text-sm text-muted">See customer details and appointment times.</p>
            <Link className="mt-4 inline-block text-sm text-brand hover:underline" to="/admin/bookings">
              View →
            </Link>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
