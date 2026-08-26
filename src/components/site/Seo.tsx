import { useEffect } from "react";
import { SITE } from "../../lib/site/constants";
import {
  DEFAULT_DESCRIPTION,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_TYPE,
  OG_IMAGE_WIDTH,
  absoluteUrl,
  documentTitle,
  ogImageUrl,
  seoForPath,
} from "../../lib/site/seo";

export function SiteSeo({
  title,
  description,
  path = "/",
  image,
  shareTitle,
  jsonLd,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  shareTitle?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
}) {
  const preset = seoForPath(path);
  const pageTitle = documentTitle(title ?? preset?.title);
  const socialTitle = shareTitle ?? preset?.shareTitle ?? pageTitle;
  const desc = description ?? preset?.description ?? DEFAULT_DESCRIPTION;
  const canonical = absoluteUrl(path === "/" ? "/" : path);
  const ogImage = ogImageUrl(image);
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    document.title = pageTitle;

    const upsertMeta = (key: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    upsertMeta("description", desc);
    upsertMeta("robots", noIndex ? "noindex,nofollow" : "index,follow");
    upsertMeta("og:title", socialTitle, "property");
    upsertMeta("og:description", desc, "property");
    upsertMeta("og:url", canonical, "property");
    upsertMeta("og:type", "website", "property");
    upsertMeta("og:site_name", SITE.shortName, "property");
    upsertMeta("og:locale", "en_NZ", "property");
    upsertMeta("og:image", ogImage, "property");
    upsertMeta("og:image:secure_url", ogImage, "property");
    upsertMeta("og:image:type", OG_IMAGE_TYPE, "property");
    upsertMeta("og:image:width", String(OG_IMAGE_WIDTH), "property");
    upsertMeta("og:image:height", String(OG_IMAGE_HEIGHT), "property");
    upsertMeta("og:image:alt", OG_IMAGE_ALT, "property");
    upsertMeta("twitter:card", "summary_large_image");
    upsertMeta("twitter:title", socialTitle);
    upsertMeta("twitter:description", desc);
    upsertMeta("twitter:image", ogImage);
    upsertMeta("twitter:image:alt", OG_IMAGE_ALT);
    upsertMeta("twitter:url", canonical);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;

    const existing = document.querySelectorAll('script[data-site-jsonld="true"]');
    existing.forEach((n) => n.remove());

    if (jsonLdText) {
      const parsed = JSON.parse(jsonLdText) as Record<string, unknown> | Record<string, unknown>[];
      const payloads = Array.isArray(parsed) ? parsed : [parsed];
      for (const payload of payloads) {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-site-jsonld", "true");
        script.textContent = JSON.stringify(payload);
        document.head.appendChild(script);
      }
    }
  }, [pageTitle, socialTitle, desc, canonical, ogImage, jsonLdText, noIndex]);

  return null;
}
