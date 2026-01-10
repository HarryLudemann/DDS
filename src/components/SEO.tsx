import { useEffect } from "react";

export function SEO({
  title,
  description,
  canonical,
  ogImage,
  type = "website",
}: {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  type?: "website" | "article";
}) {
  const baseUrl = "https://dds.harryludemann.com";
  const siteName = "Dylan's Detailing Service";
  const defaultTitle = "Dylan's Detailing Service | Professional Car Detailing in Wellington";
  const defaultDescription =
    "Professional car detailing in Wellington. Choose a service, pick an available time, and book online. Interior refresh, paint gloss, and glass + trim services.";

  const finalTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalCanonical = canonical || baseUrl;
  const finalOgImage = ogImage || `${baseUrl}/android-chrome-512x512.png`;

  useEffect(() => {
    // Update title
    document.title = finalTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Description
    updateMetaTag("description", finalDescription);

    // Open Graph
    updateMetaTag("og:title", finalTitle, true);
    updateMetaTag("og:description", finalDescription, true);
    updateMetaTag("og:url", finalCanonical, true);
    updateMetaTag("og:type", type, true);
    updateMetaTag("og:image", finalOgImage, true);
    updateMetaTag("og:site_name", siteName, true);
    updateMetaTag("og:locale", "en_NZ", true);

    // Twitter
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", finalTitle);
    updateMetaTag("twitter:description", finalDescription);
    updateMetaTag("twitter:image", finalOgImage);

    // Canonical
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = finalCanonical;

    // Add JSON-LD structured data for Organization (required for logo in search)
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${baseUrl}/#organization`,
      name: siteName,
      description: finalDescription,
      url: baseUrl,
      logo: `${baseUrl}/android-chrome-512x512.png`,
      image: [`${baseUrl}/android-chrome-512x512.png`],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Wellington",
        addressRegion: "Wellington",
        addressCountry: "NZ",
      },
      areaServed: {
        "@type": "City",
        name: "Wellington",
      },
      priceRange: "$$",
      serviceType: "Car Detailing",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        reviewCount: "10",
      },
      sameAs: [], // Add social media links here when available
    };

    // Remove old organization schema if it exists
    const existingSchema = document.querySelector('script[type="application/ld+json"][data-schema="organization"]');
    if (existingSchema) {
      existingSchema.remove();
    }

    // Add new organization schema
    const schemaScript = document.createElement("script");
    schemaScript.type = "application/ld+json";
    schemaScript.setAttribute("data-schema", "organization");
    schemaScript.textContent = JSON.stringify(organizationSchema);
    document.head.appendChild(schemaScript);

    // Add Website schema
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: siteName,
      description: finalDescription,
      publisher: {
        "@id": `${baseUrl}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/book?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };

    const existingWebsiteSchema = document.querySelector('script[type="application/ld+json"][data-schema="website"]');
    if (existingWebsiteSchema) {
      existingWebsiteSchema.remove();
    }

    const websiteSchemaScript = document.createElement("script");
    websiteSchemaScript.type = "application/ld+json";
    websiteSchemaScript.setAttribute("data-schema", "website");
    websiteSchemaScript.textContent = JSON.stringify(websiteSchema);
    document.head.appendChild(websiteSchemaScript);
  }, [finalTitle, finalDescription, finalCanonical, finalOgImage, type, baseUrl, siteName]);

  return null;
}
