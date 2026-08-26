import { GALLERY } from "../../lib/site/media";
import { SiteSeo } from "../../components/site/Seo";
import { Container } from "../../components/site/ui/Container";
import { SectionHeading } from "../../components/site/ui/SectionHeading";
import { Reveal } from "../../components/site/ui/Reveal";
import { SiteButtonLink } from "../../components/site/ui/Button";
import { SitePhoto } from "../../components/site/ui/SitePhoto";

export default function Gallery() {
  return (
    <>
      <SiteSeo path="/gallery" />
      <Container className="py-16 sm:py-24">
        <SectionHeading
          eyebrow="Gallery"
          title="What leaves the studio."
          body="Paint, interior, and glass after a studio detail. Book the package that matches the work you want."
        />
        <div className="mt-16 grid gap-10 md:grid-cols-2 md:gap-8">
          {GALLERY.map((img, i) => (
            <Reveal key={img.src} delay={i * 80} className={i === 0 ? "md:col-span-2" : undefined}>
              <figure>
                <SitePhoto
                  image={img}
                  aspect={i === 0 ? "aspect-[16/9]" : "aspect-[4/5]"}
                  loading="eager"
                />
                <figcaption className="mt-3 text-[13px] text-[var(--site-muted)]">{img.caption}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <div className="mt-20">
          <SiteButtonLink to="/book" size="lg">
            Book a drop-off
          </SiteButtonLink>
        </div>
      </Container>
    </>
  );
}
