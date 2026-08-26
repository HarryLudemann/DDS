import { SITE } from "./constants";
import { DEFAULT_DESCRIPTION, ogImageUrl } from "./seo";

export function localBusinessJsonLd(openingHours?: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": ["AutoRepair", "LocalBusiness"],
    "@id": `${SITE.baseUrl}/#business`,
    name: SITE.name,
    alternateName: SITE.shortName,
    description: DEFAULT_DESCRIPTION,
    url: SITE.baseUrl,
    image: ogImageUrl(),
    logo: `${SITE.baseUrl}/android-chrome-512x512.png`,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      addressCountry: SITE.country,
    },
    areaServed: {
      "@type": "City",
      name: SITE.city,
    },
    priceRange: "$$",
    currenciesAccepted: "NZD",
    serviceType: SITE.serviceType,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Studio drop-off detailing",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Studio drop-off car detailing",
            areaServed: SITE.city,
          },
        },
      ],
    },
    ...(openingHours && openingHours.length > 0 ? { openingHours } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.baseUrl}/#website`,
    name: SITE.shortName,
    alternateName: SITE.name,
    url: SITE.baseUrl,
    inLanguage: "en-NZ",
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": `${SITE.baseUrl}/#business` },
  };
}
