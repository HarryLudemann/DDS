import type { ReactNode } from "react";
import { Container } from "../../components/site/ui/Container";
import { SiteSeo } from "../../components/site/Seo";

export default function LegalPage({
  title,
  description,
  path,
  children,
}: {
  title: string;
  description: string;
  path: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteSeo title={title} description={description} path={path} />
      <Container className="py-16 sm:py-24">
        <h1 className="max-w-3xl font-display text-4xl sm:text-5xl">{title}</h1>
        <div className="mt-10 max-w-2xl space-y-8 text-[15px] leading-relaxed text-[var(--site-muted)]">
          {children}
        </div>
      </Container>
    </>
  );
}
