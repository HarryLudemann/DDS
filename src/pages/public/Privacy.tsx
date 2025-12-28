import { Card } from "../../components/ui/Card";

export default function Privacy() {
  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-600">
          This policy explains how Dylan’s Detailing Service collects, uses, and protects personal information in New Zealand.
        </p>
      </div>

      <Card className="space-y-4 max-w-3xl">
        <div>
          <div className="text-sm font-extrabold text-slate-900">What we collect</div>
          <div className="mt-2 text-sm text-slate-700">
            When you use the booking form we collect information you provide, such as your name and email address. Phone, vehicle
            details, and notes are optional.
          </div>
        </div>

        <div>
          <div className="text-sm font-extrabold text-slate-900">Why we collect it</div>
          <div className="mt-2 text-sm text-slate-700">
            We use your information to manage bookings, communicate with you about your appointment, and provide the requested
            detailing service.
          </div>
        </div>

        <div>
          <div className="text-sm font-extrabold text-slate-900">How we store and protect information</div>
          <div className="mt-2 text-sm text-slate-700">
            Booking information is stored securely and access is limited to the business administrator. We take reasonable steps to
            protect information from loss, misuse, and unauthorised access.
          </div>
        </div>

        <div>
          <div className="text-sm font-extrabold text-slate-900">Sharing</div>
          <div className="mt-2 text-sm text-slate-700">
            We do not sell personal information. We may share information with service providers used to operate the website or
            booking system, only as required to run the service.
          </div>
        </div>

        <div>
          <div className="text-sm font-extrabold text-slate-900">Your rights</div>
          <div className="mt-2 text-sm text-slate-700">
            You may request access to, or correction of, your personal information. If you have concerns about privacy, you can
            contact the business.
          </div>
        </div>

        <div className="text-xs text-slate-500">Last updated: {new Date().toLocaleDateString("en-NZ")}</div>
      </Card>
    </div>
  );
}
