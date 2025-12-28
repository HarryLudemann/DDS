import { Card } from "../../components/ui/Card";

export default function Cookies() {
  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Cookie Policy</h1>
        <p className="mt-2 text-sm text-slate-600">
          This site uses minimal cookies and similar storage to operate reliably and to remember your preferences.
        </p>
      </div>

      <Card className="space-y-4 max-w-3xl">
        <div>
          <div className="text-sm font-extrabold text-slate-900">What we use</div>
          <div className="mt-2 text-sm text-slate-700">
            We may use essential cookies and/or local storage for:
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Security and preventing abuse.</li>
              <li>Remembering that you have accepted or declined cookies.</li>
              <li>Admin login session storage (admin-only).</li>
            </ul>
          </div>
        </div>

        <div>
          <div className="text-sm font-extrabold text-slate-900">Analytics</div>
          <div className="mt-2 text-sm text-slate-700">
            If analytics are enabled in the future, this policy will be updated to explain what is collected and how to opt out.
          </div>
        </div>

        <div>
          <div className="text-sm font-extrabold text-slate-900">Your choices</div>
          <div className="mt-2 text-sm text-slate-700">
            You can control cookies via your browser settings. You can also change your cookie consent choice by clearing site data
            in your browser.
          </div>
        </div>

        <div className="text-xs text-slate-500">Last updated: {new Date().toLocaleDateString("en-NZ")}</div>
      </Card>
    </div>
  );
}
