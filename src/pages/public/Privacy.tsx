import { Card } from "../../components/ui/Card";
import { SEO } from "../../components/SEO";

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Privacy policy for Dylan's Detailing Service. Learn how we collect, use, and protect your personal information."
        canonical="https://dds.harryludemann.com/privacy"
      />
      <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-600">
          This policy explains how Dylan’s Detailing Service collects, uses, and protects personal information in New Zealand.
        </p>
      </div>

      <Card className="space-y-6 max-w-3xl">
        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-2">What we collect</div>
          <div className="text-sm text-slate-700 leading-relaxed">
            When you use the booking form we collect information you provide, such as your name and email address. Phone, vehicle
            details, and notes are optional.
          </div>
        </div>

        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Why we collect it</div>
          <div className="text-sm text-slate-700 leading-relaxed">
            We use your information to manage bookings, communicate with you about your appointment, and provide the requested
            detailing service.
          </div>
        </div>

        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-2">How we store and protect information</div>
          <div className="text-sm text-slate-700 leading-relaxed">
            Booking information is stored securely and access is limited to the business administrator. We take reasonable steps to
            protect information from loss, misuse, and unauthorised access.
          </div>
        </div>

        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Sharing</div>
          <div className="text-sm text-slate-700 leading-relaxed">
            We do not sell personal information. We may share information with service providers used to operate the website or
            booking system, only as required to run the service.
          </div>
        </div>

        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Your rights</div>
          <div className="text-sm text-slate-700 leading-relaxed">
            You may request access to, or correction of, your personal information. If you have concerns about privacy, you can
            contact the business.
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
