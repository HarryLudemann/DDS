export const GST_RATE = 0.15 as const;

export type TaxMode = "gst_included" | "gst_excluded" | "no_gst";

export const TAX_MODE: TaxMode = "gst_included";

export function taxLabelShort(mode: TaxMode = TAX_MODE) {
  if (mode === "gst_included") return "GST incl.";
  if (mode === "gst_excluded") return "+ GST";
  return "No GST";
}

export function amountsForCustomerPrice(inputCents: number, mode: TaxMode = TAX_MODE, rate: number = GST_RATE) {
  const n = Math.round(Number(inputCents));
  if (!Number.isFinite(n)) {
    return { netCents: 0, gstCents: 0, grossCents: 0 };
  }

  if (mode === "no_gst") {
    return { netCents: n, gstCents: 0, grossCents: n };
  }

  if (mode === "gst_included") {
    const netCents = Math.round(n / (1 + rate));
    const gstCents = n - netCents;
    return { netCents, gstCents, grossCents: n };
  }

  const netCents = n;
  const gstCents = Math.round(netCents * rate);
  const grossCents = netCents + gstCents;
  return { netCents, gstCents, grossCents };
}
