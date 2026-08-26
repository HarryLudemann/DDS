import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Plugin } from "vite";
import {
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_TYPE,
  OG_IMAGE_WIDTH,
  SEO_PAGES,
  absoluteUrl,
  documentTitle,
  ogImageUrl,
} from "./src/lib/site/seo";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setMeta(html: string, attr: "name" | "property", key: string, content: string) {
  const re = new RegExp(`<meta[^>]*${attr}="${key}"[^>]*/?>`, "i");
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace("</head>", `  ${tag}\n</head>`);
}

function setTitle(html: string, title: string) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  }
  return html.replace("</head>", `  <title>${escapeHtml(title)}</title>\n</head>`);
}

function setCanonical(html: string, url: string) {
  const tag = `<link rel="canonical" href="${escapeHtml(url)}" />`;
  if (/<link[^>]*rel="canonical"[^>]*>/i.test(html)) {
    return html.replace(/<link[^>]*rel="canonical"[^>]*>/i, tag);
  }
  return html.replace("</head>", `  ${tag}\n</head>`);
}

export function seoHtmlPlugin(): Plugin {
  return {
    name: "dds-seo-html",
    closeBundle() {
      const dist = join(process.cwd(), "dist");
      const indexPath = join(dist, "index.html");
      const source = readFileSync(indexPath, "utf8");
      const og = ogImageUrl();

      for (const page of SEO_PAGES) {
        const title = documentTitle(page.title);
        const url = absoluteUrl(page.path);
        let html = source;
        html = setTitle(html, title);
        html = setCanonical(html, url);
        html = setMeta(html, "name", "description", page.description);
        html = setMeta(html, "property", "og:title", page.shareTitle);
        html = setMeta(html, "property", "og:description", page.description);
        html = setMeta(html, "property", "og:url", url);
        html = setMeta(html, "property", "og:image", og);
        html = setMeta(html, "property", "og:image:secure_url", og);
        html = setMeta(html, "property", "og:image:type", OG_IMAGE_TYPE);
        html = setMeta(html, "property", "og:image:width", String(OG_IMAGE_WIDTH));
        html = setMeta(html, "property", "og:image:height", String(OG_IMAGE_HEIGHT));
        html = setMeta(html, "property", "og:image:alt", OG_IMAGE_ALT);
        html = setMeta(html, "name", "twitter:title", page.shareTitle);
        html = setMeta(html, "name", "twitter:description", page.description);
        html = setMeta(html, "name", "twitter:image", og);
        html = setMeta(html, "name", "twitter:image:alt", OG_IMAGE_ALT);
        html = setMeta(html, "name", "twitter:url", url);

        const out =
          page.path === "/" ? indexPath : join(dist, page.path.replace(/^\//, ""), "index.html");
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, html);
      }
    },
  };
}
