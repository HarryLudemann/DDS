import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteService, listAllServices, seedDefaults, updateService } from "../../lib/firebase/store";
import { notifyServicesUpdated } from "../../lib/site/live";
import type { Service } from "../../types/db";
import { fmtDuration, fmtMoney } from "../../utils/format";
import { AdminBanner, AdminButton, AdminButtonLink } from "./ui";

export default function ServicesPanel() {
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setRows(await listAllServices());
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to load services.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(s: Service) {
    try {
      await updateService(s.id, { active: !s.active });
      notifyServicesUpdated();
      await load();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not update visibility.");
    }
  }

  async function remove(s: Service) {
    if (!window.confirm(`Delete “${s.title}”? This cannot be undone.`)) return;
    try {
      await deleteService(s.id);
      notifyServicesUpdated();
      await load();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not delete.");
    }
  }

  async function seed() {
    setSeeding(true);
    setStatus(null);
    try {
      const result = await seedDefaults();
      setStatus(result.reason);
      if (result.seeded) notifyServicesUpdated();
      await load();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Seed failed.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-[var(--admin-muted)]">
          Edit a service to change what customers see. Hide it to take it off the site without deleting.
        </p>
        <AdminButtonLink to="/admin/services/new">Add service</AdminButtonLink>
      </div>

      {status && <AdminBanner>{status}</AdminBanner>}

      {rows.length === 0 && !loading && (
        <div className="border border-[var(--admin-line)] bg-white px-5 py-8">
          <p className="font-medium">No services yet</p>
          <p className="mt-1 max-w-md text-sm text-[var(--admin-muted)]">
            Load the default catalogue, or add your first service.
          </p>
          <AdminButton className="mt-5" variant="secondary" disabled={seeding} onClick={seed}>
            {seeding ? "Loading…" : "Load default catalogue"}
          </AdminButton>
        </div>
      )}

      <div className="divide-y divide-[var(--admin-line)] border border-[var(--admin-line)] bg-white">
        {loading && rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--admin-muted)]">Loading services…</p>
        ) : (
          rows.map((s) => (
            <div key={s.id} className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <Link to={`/admin/services/${s.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">{s.title}</span>
                  <span className="text-xs text-[var(--admin-muted)]">{s.active ? "On the site" : "Hidden"}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  From {fmtMoney(s.price_cents)} · {fmtDuration(s.duration_mins)}
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <AdminButtonLink to={`/admin/services/${s.id}`} variant="secondary" className="h-9 px-3">
                  Edit
                </AdminButtonLink>
                <AdminButton variant="ghost" className="h-9 px-3" onClick={() => toggleActive(s)}>
                  {s.active ? "Hide" : "Show"}
                </AdminButton>
                <AdminButton variant="danger" className="h-9 px-3" onClick={() => remove(s)}>
                  Delete
                </AdminButton>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
