import { SITE } from "./constants";

export const OG_IMAGE_PATH = "/og.jpg";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_TYPE = "image/jpeg";
export const OG_IMAGE_ALT = "DDS — studio car detailing in Wellington";

export const DEFAULT_TITLE = "DDS | Studio Detailing in Wellington";
export const DEFAULT_SHARE_TITLE = "DDS — Studio car detailing in Wellington";
export const DEFAULT_DESCRIPTION =
  "Studio drop-off car detailing in Wellington. Specified packages, GST-inclusive starting prices, and a confirmed booking. No payment online.";

export type SeoPage = {
  path: string;
  title: string;
  shareTitle: string;
  description: string;
};

export const SEO_PAGES: SeoPage[] = [
  {
    path: "/",
    title: DEFAULT_TITLE,
    shareTitle: DEFAULT_SHARE_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  {
    path: "/services",
    title: "Packages",
    shareTitle: "Detailing packages | DDS Wellington",
    description:
      "Interior, exterior, and full-detail packages in Wellington. Inclusions, starting prices, and a studio drop-off you can book online.",
  },
  {
    path: "/book",
    title: "Book a drop-off",
    shareTitle: "Book a studio drop-off | DDS Wellington",
    description:
      "Reserve a studio drop-off in Wellington. Choose a package and a window — we confirm the time. No payment is taken online.",
  },
  {
    path: "/gallery",
    title: "Gallery",
    shareTitle: "The finish | DDS Wellington",
    description: "Paint, interior, and glass after a studio detail at DDS in Wellington.",
  },
  {
    path: "/about",
    title: "The studio",
    shareTitle: "The studio | DDS Wellington",
    description:
      "DDS is studio drop-off detailing in Wellington. Specified packages, controlled conditions, and a confirmed time — not a quote chase.",
  },
  {
    path: "/contact",
    title: "Contact",
    shareTitle: "Unsure? Book anyway | DDS Wellington",
    description:
      "Not sure which package you need? Book a drop-off with DDS in Wellington and we’ll contact you to confirm the work and the time.",
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    shareTitle: "Privacy Policy | DDS",
    description: "How DDS collects, uses, and protects personal information in New Zealand.",
  },
  {
    path: "/cookies",
    title: "Cookies",
    shareTitle: "Cookies | DDS",
    description: "How DDS uses on-device storage — no ads, no analytics, only what’s needed to run the site.",
  },
  {
    path: "/terms",
    title: "Terms of Service",
    shareTitle: "Terms of Service | DDS",
    description: "Booking terms, pricing, cancellation, and liability for DDS in New Zealand.",
  },
];

export function seoForPath(path: string): SeoPage | undefined {
  const clean = path === "" ? "/" : path;
  return SEO_PAGES.find((page) => page.path === clean);
}

export function documentTitle(title?: string) {
  if (!title) return DEFAULT_TITLE;
  if (title.includes("|")) return title;
  return `${title} | ${SITE.shortName}`;
}

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  const suffix = path === "/" ? "/" : path;
  return `${SITE.baseUrl}${suffix}`;
}

export function ogImageUrl(image?: string) {
  if (!image) return `${SITE.baseUrl}${OG_IMAGE_PATH}`;
  if (image.startsWith("http")) return image;
  return `${SITE.baseUrl}${image.startsWith("/") ? image : `/${image}`}`;
}
