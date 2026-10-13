import type { ReactNode } from "react";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PageShell({
  children,
  width = "max-w-[1400px]",
}: {
  children: ReactNode;
  width?: string;
}) {
  return (
    <div className="min-h-screen bg-cream font-body text-ink antialiased selection:bg-gold/40">
      <div className={`mx-auto ${width} px-4 sm:px-8 lg:px-10`}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
    </div>
  );
}

/** Shared header block for simple content pages. */
export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-ink/10 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">{eyebrow}</p>
      <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[1.05] sm:text-6xl">
        {title}
      </h1>
      {children && (
        <div className="mt-5 max-w-2xl text-base leading-relaxed text-ink/65">{children}</div>
      )}
    </section>
  );
}
