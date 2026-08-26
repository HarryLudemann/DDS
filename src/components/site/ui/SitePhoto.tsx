import { cn } from "../../../lib/site/cn";
import type { SiteImage } from "../../../lib/site/media";

const RATIOS: Record<string, string> = {
  "aspect-[16/10]": "62.5%",
  "aspect-[16/9]": "56.25%",
  "aspect-[4/3]": "75%",
  "aspect-[5/4]": "80%",
  "aspect-[4/5]": "125%",
};

export function SitePhoto({
  image,
  aspect = "aspect-[16/10]",
  className,
  imgClassName,
  loading = "lazy",
  fetchPriority,
}: {
  image: SiteImage;
  aspect?: string;
  className?: string;
  imgClassName?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
}) {
  const pad = RATIOS[aspect] ?? "62.5%";

  return (
    <div
      className={cn("relative overflow-hidden bg-[#d8d5ce]", className)}
      style={{
        backgroundImage: `url(${image.src})`,
        backgroundSize: "cover",
        backgroundPosition: image.objectPosition,
      }}
    >
      <div aria-hidden="true" style={{ paddingTop: pad }} />
      <img
        src={image.src}
        alt={image.alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        className={cn("site-photo-img absolute inset-0", imgClassName)}
        style={{ objectPosition: image.objectPosition }}
      />
    </div>
  );
}
