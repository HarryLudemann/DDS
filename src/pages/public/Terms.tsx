import { Card } from "../../components/ui/Card";

export default function Terms() {
  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-600">
          These terms apply to the use of this website and the online booking request process in New Zealand.
        </p>
      </div>

      <Card className="space-y-4 max-w-3xl">
        <div>
          <div className="text-sm font-extrabold text-slate-900">Bookings</div>
          <div className="mt-2 text-sm text-slate-700">
            Submitting a booking request does not take payment. The business may contact you to confirm the exact drop-off time,
            details, and final price (if inspection-based).
          </div>
        </div>

        <div>
          <div className="text-sm font-extrabold text-slate-900">Pricing</div>
          <div className="mt-2 text-sm text-slate-700">
            Displayed prices are starting prices. Final pricing may vary based on vehicle size and condition. Any quoted price will be
            confirmed with you before work begins.
          </div>
        </div>

        <div>
          <div className="text-sm font-extrabold text-slate-900">Cancellations</div>
          <div className="mt-2 text-sm text-slate-700">
            If you need to cancel or reschedule, please contact the business as early as possible.
          </div>
        </div>

        <div>
          <div className="text-sm font-extrabold text-slate-900">Liability</div>
          <div className="mt-2 text-sm text-slate-700">
            Services are provided with reasonable care and skill. Where permitted, liability is limited to the extent allowed under New
            Zealand consumer law.
          </div>
        </div>

        <div className="text-xs text-slate-500">Last updated: {new Date().toLocaleDateString("en-NZ")}</div>
      </Card>
    </div>
  );
}
