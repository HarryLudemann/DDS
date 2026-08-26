import type { Service } from "../../types/db";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function serviceSlug(service: Service, all: Service[]) {
  const base = slugify(service.title) || service.id;
  const clashes = all.filter((s) => slugify(s.title) === slugify(service.title));
  if (clashes.length <= 1) return base;
  return `${base}-${service.id.slice(0, 8)}`;
}

export function findServiceBySlug(services: Service[], slug: string) {
  return services.find((s) => serviceSlug(s, services) === slug) ?? null;
}
