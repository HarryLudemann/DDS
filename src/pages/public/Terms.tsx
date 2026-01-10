import { Card } from "../../components/ui/Card";
import { SEO } from "../../components/SEO";

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="Terms of service for Dylan's Detailing Service. Read our booking terms, pricing, cancellation, and liability policies."
        canonical="https://dds.harryludemann.com/terms"
      />
      <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-600">
          These terms apply to the use of this website and the online booking request process in New Zealand.
        </p>
      </div>

      <Card className="space-y-6 max-w-3xl">
        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Bookings</div>
          <div className="text-sm text-slate-700 leading-relaxed">
            Submitting a booking request does not take payment. The business may contact you to confirm the exact drop-off time,
            details, and final price (if inspection-based).
          </div>
        </div>

        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Pricing</div>
          <div className="text-sm text-slate-700 leading-relaxed">
            Displayed prices are starting prices. Final pricing may vary based on vehicle size and condition. Any quoted price will be
            confirmed with you before work begins.
          </div>
        </div>

        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Cancellations</div>
          <div className="text-sm text-slate-700 leading-relaxed">
            If you need to cancel or reschedule, please contact the business as early as possible.
          </div>
        </div>

        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Liability</div>
          <div className="text-sm text-slate-700 leading-relaxed">
            Services are provided with reasonable care and skill. Where permitted, liability is limited to the extent allowed under New
            Zealand consumer law.
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/80">
          <div className="text-xs text-slate-500">Last updated: {new Date().toLocaleDateString("en-NZ")}</div>
        </div>
      </Card>
      </div>
    </>
  );
}
