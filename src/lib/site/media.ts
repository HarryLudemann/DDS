export type SiteImage = {
  src: string;
  alt: string;
  caption: string;
  /** Used when the frame is wider than the photo, so dark paint shots keep the cloth/hand in view. */
  objectPosition: string;
};

export const GALLERY: SiteImage[] = [
  {
    src: "/images/paint.webp",
    alt: "Exterior paint after a studio detail",
    caption: "Paint",
    objectPosition: "50% 28%",
  },
  {
    src: "/images/interior.webp",
    alt: "Interior after a studio detail",
    caption: "Interior",
    objectPosition: "50% 45%",
  },
  {
    src: "/images/glass.webp",
    alt: "Glass and trim after a studio detail",
    caption: "Glass + trim",
    objectPosition: "70% 50%",
  },
];

export const HERO_IMAGE: SiteImage = GALLERY[0]!;

const PAINT: SiteImage = GALLERY[0]!;
const INTERIOR: SiteImage = GALLERY[1]!;
const GLASS: SiteImage = GALLERY[2]!;

export function imageForService(
  title: string,
  subtitle?: string | null,
  summary?: string | null,
  includes?: string[] | null,
): SiteImage {
  const head = `${title} ${subtitle ?? ""}`.toLowerCase();
  const blob = `${head} ${summary ?? ""} ${(includes ?? []).join(" ")}`.toLowerCase();

  if (head.includes("vac") || head.includes("express") || head.includes("cabin")) return INTERIOR;
  if (head.includes("deep") || head.includes("restoration") || head.includes("interior")) return INTERIOR;
  if (head.includes("maintenance") || head.includes("glass")) return GLASS;
  if (head.includes("paint") || head.includes("protection") || head.includes("ceramic")) return PAINT;
  if (head.includes("full") || head.includes("wash") || head.includes("exterior")) return PAINT;

  if (blob.includes("vacuum") || blob.includes("pet hair") || blob.includes("carpet")) return INTERIOR;
  if (blob.includes("glass") || blob.includes("trim")) return GLASS;
  return PAINT;
}
