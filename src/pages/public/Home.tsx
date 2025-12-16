import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Section, SectionHeader } from "../../components/layout/Section";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* HERO (keep yours if you like; this is polished for phones) */}
      <section className="relative overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-indigo-200/70 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-[520px] w-[520px] rounded-full bg-sky-200/60 blur-3xl" />

        <div className="relative p-7 sm:p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
            Wellington · Studio detailing · Online booking
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
            Clean car, sharp finish.
            <span className="block text-slate-500">Booked online.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl">
            Choose a service, pick a time that suits, and you’re locked in.
            Simple booking — professional results.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link to="/book" className="sm:w-auto w-full">
              <Button className="w-full sm:w-auto px-7 py-3 text-base">Book Online</Button>
            </Link>
            <Link to="/services" className="sm:w-auto w-full">
              <Button variant="secondary" className="w-full sm:w-auto px-7 py-3 text-base">View Services</Button>
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-black/5">
              <div className="text-sm font-extrabold text-slate-900">Interior</div>
              <div className="mt-1 text-sm text-slate-600">
                Deep clean + reset: plastics, glass, vacuum, extraction as needed.
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-black/5">
              <div className="text-sm font-extrabold text-slate-900">Exterior</div>
              <div className="mt-1 text-sm text-slate-600">
                Safe wash, wheels, decon + protection options.
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-black/5">
              <div className="text-sm font-extrabold text-slate-900">Maintenance</div>
              <div className="mt-1 text-sm text-slate-600">
                Keep it perfect between details.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Customer-friendly sections */}
      <Section>
        <SectionHeader
          title="A smooth booking experience"
          subtitle="Pick a service first — then you’ll only see times that fit that service."
          right={
            <Link to="/book" className="hidden md:block">
              <Button>See availability</Button>
            </Link>
          }
        />

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-600 text-white grid place-items-center text-sm font-extrabold">
                1
              </div>
              <div className="text-sm font-extrabold text-slate-900">Choose a service</div>
            </div>
            <p className="text-sm text-slate-600">
              Select the package that matches what you want done.
            </p>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-600 text-white grid place-items-center text-sm font-extrabold">
                2
              </div>
              <div className="text-sm font-extrabold text-slate-900">Pick a time</div>
            </div>
            <p className="text-sm text-slate-600">
              You’ll only see start-times that actually fit the service length.
            </p>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-600 text-white grid place-items-center text-sm font-extrabold">
                3
              </div>
              <div className="text-sm font-extrabold text-slate-900">Confirm details</div>
            </div>
            <p className="text-sm text-slate-600">
              Leave your info and any notes — you’ll get confirmation on screen.
            </p>
          </Card>
        </div>

        {/* mobile CTA */}
        <div className="md:hidden">
          <Link to="/book"><Button className="w-full">See availability</Button></Link>
        </div>
      </Section>

      <Section>
        <SectionHeader
          title="What to expect"
          subtitle="Clear, professional service — no fluff."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <div className="text-sm font-extrabold text-slate-900">Wellington studio</div>
            <p className="mt-2 text-sm text-slate-600">
              Appointments are scheduled at the studio. You’ll receive confirmation after booking.
            </p>
          </Card>
          <Card>
            <div className="text-sm font-extrabold text-slate-900">Transparent packages</div>
            <p className="mt-2 text-sm text-slate-600">
              Choose a service with a clear duration and price. The booking page handles the schedule.
            </p>
          </Card>
        </div>
      </Section>

      {/* CTA */}
      <section className="rounded-3xl bg-slate-900 p-8 md:p-12 text-white">
        <div className="text-xs font-semibold text-white/70">Ready</div>
        <div className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
          Book a time that fits.
        </div>
        <div className="mt-3 text-white/70 max-w-2xl">
          Choose your service and pick from available times — the schedule updates automatically.
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link to="/book" className="w-full sm:w-auto">
            <Button variant="inverted" className="w-full sm:w-auto px-7 py-3 text-base">
              Book Online
            </Button>
          </Link>
          <Link to="/services" className="w-full sm:w-auto">
            <Button variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/10 px-7 py-3 text-base">
              View Services
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
