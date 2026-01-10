import { Card } from "../../components/ui/Card";
import { SEO } from "../../components/SEO";

export default function Cookies() {
  return (
    <>
      <SEO
        title="Cookie Policy"
        description="Cookie policy for Dylan's Detailing Service. Learn about the cookies and local storage we use on our website."
        canonical="https://dds.harryludemann.com/cookies"
      />
      <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Cookie Policy</h1>
        <p className="mt-2 text-sm text-slate-600">
          This site uses minimal cookies and similar storage to operate reliably and to remember your preferences.
        </p>
      </div>

      <Card className="space-y-6 max-w-3xl">
        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-2">What we use</div>
          <div className="text-sm text-slate-700 leading-relaxed">
            We may use essential cookies and/or local storage for:
            <ul className="mt-3 ml-4 space-y-2 list-disc text-slate-700">
              <li>Security and preventing abuse.</li>
              <li>Remembering that you have accepted or declined cookies.</li>
              <li>Admin login session storage (admin-only).</li>
            </ul>
          </div>
        </div>

        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Analytics</div>
          <div className="text-sm text-slate-700 leading-relaxed">
            If analytics are enabled in the future, this policy will be updated to explain what is collected and how to opt out.
          </div>
        </div>

        <div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 mb-2">Your choices</div>
          <div className="text-sm text-slate-700 leading-relaxed">
            You can control cookies via your browser settings. You can also change your cookie consent choice by clearing site data
            in your browser.
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
