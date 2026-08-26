import { useMemo } from "react";
import { PACKAGES as DEFAULT_PACKAGES } from "../catalog/packages";

export type PackageDefinition = {
  code: string;
  title: string;
  subtitle: string;
  summary: string;
  includes: string[];
  idealFor: string[];
  fromPriceCents: number;
  active: boolean;
  serviceId?: string | null;
};

export function usePackages() {
  const packages = useMemo(
    () =>
      DEFAULT_PACKAGES.map((p) => ({
        code: p.code,
        title: p.title,
        subtitle: p.subtitle,
        summary: p.summary,
        includes: [...p.includes],
        idealFor: [...p.idealFor],
        fromPriceCents: p.fromPriceCents,
        active: true,
        serviceId: null,
      })) satisfies PackageDefinition[],
    []
  );

  const byCode = useMemo(() => new Map<string, PackageDefinition>(packages.map((p) => [p.code, p])), [packages]);

  return {
    packages,
    loading: false,
    error: null as string | null,
    getByCode: (code: string | null | undefined) => {
      if (!code) return null;
      return byCode.get(code) ?? null;
    },
  };
}
