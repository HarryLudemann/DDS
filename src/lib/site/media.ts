export type SiteImage = {
  src: string;
  alt: string;
  caption: string;
  /** Crop anchor for object-fit: cover. */
  objectPosition: string;
};

/**
 * Licensed stock — not studio photography.
 * Hero: Unsplash / Avenir Visuals (https://unsplash.com/photos/9U-_m0dfNuw)
 * Paint: Pexels 6872149
 * Interior: Unsplash (https://unsplash.com/photos/fY73npw7c_w)
 * Glass: Unsplash (https://unsplash.com/photos/ydYotkM_wj0)
 */
export const HERO_IMAGE: SiteImage = {
  src: "/images/hero.webp",
  alt: "",
  caption: "",
  objectPosition: "52% 48%",
};

export const GALLERY: SiteImage[] = [
  {
    src: "/images/paint.webp",
    alt: "Soap foam on glossy black paint and a round headlight",
    caption: "Paint",
    objectPosition: "28% 42%",
  },
  {
    src: "/images/interior.webp",
    alt: "Perforated leather seat with contrast stitching",
    caption: "Interior",
    objectPosition: "48% 38%",
  },
  {
    src: "/images/glass.webp",
    alt: "Rain beading on a windshield",
    caption: "Glass",
    objectPosition: "50% 22%",
  },
];

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
