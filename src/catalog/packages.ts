export type PackageCode =
  | "interior_refresh"
  | "full_interior"
  | "exterior_refresh"
  | "paint_enhancement"
  | "full_detail";

export type Package = {
  code: PackageCode;
  title: string;
  subtitle: string;
  fromPriceCents: number;
  summary: string;
  includes: string[];
  idealFor: string[];
};

export const PACKAGES: Package[] = [
  {
    code: "exterior_refresh",
    title: "Express Wash + Vac",
    subtitle: "Quick turnaround (45–75 min)",
    fromPriceCents: 9000,
    summary:
      "A fast wash + tidy-up for busy weeks. Starting price varies by vehicle size.",
    includes: [
      "Hand wash",
      "Wheels / tyres quick clean",
      "Exterior windows",
      "Quick interior vacuum + wipe of dash / console",
    ],
    idealFor: ["Weekly / fortnightly customers", "Busy people", "Rideshare"],
  },
  {
    code: "interior_refresh",
    title: "Maintenance Detail",
    subtitle: "Most popular (1.5–2.5 hrs)",
    fromPriceCents: 16000,
    summary:
      "For regular customers who want their car always nice. Starting price varies by vehicle size.",
    includes: [
      "Thorough wash + wheels / arches",
      "Door jambs",
      "Full vacuum",
      "Plastics wiped",
      "Glass inside + out",
      "Light interior detail",
      "Optional spray sealant (1–3 months)",
    ],
    idealFor: ["Regular customers", "Keep it always nice"],
  },
  {
    code: "full_detail",
    title: "Full Detail Inside + Out",
    subtitle: "Full reset (3–5 hrs)",
    fromPriceCents: 35000,
    summary:
      "The full reset for most one-off customers. Starting price varies by vehicle size and condition — confirmed after a quick look (or photos).",
    includes: [
      "Full exterior wash + decon (bug / tar)",
      "Wheels / arches",
      "Interior detailed clean",
      "Glass",
      "Trim dressings",
      "Short-term paint protection (sealant)",
    ],
    idealFor: ["Pre-sale", "Haven’t cleaned it in a while", "Most one-off customers"],
  },
  {
    code: "full_interior",
    title: "Deep Clean / Restoration Detail",
    subtitle: "Neglected vehicles (5–8+ hrs)",
    fromPriceCents: 49500,
    summary:
      "For pet hair, sand/mud, stains, kids, smokers, and heavy build-up. Pricing is inspection-based (confirmed after an in-person look).",
    includes: [
      "Everything in Full Detail",
      "Seats / carpets shampoo + extraction (as needed)",
      "Heavy pet hair removal (as needed)",
      "Deeper plastics / crevices",
      "More intensive exterior decon",
    ],
    idealFor: ["Pet hair", "Sand/mud", "Stains", "Kids", "Smokers"],
  },
  {
    code: "paint_enhancement",
    title: "Wellington Protection Package",
    subtitle: "Detail + longer protection (4–7 hrs)",
    fromPriceCents: 45000,
    summary:
      "Full Detail plus longer-lasting protection for Wellington conditions. Sealant packages start from $450 — entry ceramic starts from $900+ (varies by paint correction needs).",
    includes: [
      "Full Detail Inside + Out",
      "Paint sealant (6–12 months) or entry ceramic option",
      "Glass treatment",
    ],
    idealFor: ["Parking outside", "Coastal commuters", "Keep it easy to wash"],
  },
];

export function getPackageByCode(code: string | null | undefined): Package | null {
  if (!code) return null;
  return PACKAGES.find((p) => p.code === code) ?? null;
}
