import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Globe2, HeartHandshake, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageIntro, PageShell } from "@/components/site/PageShell";
import { SITE_URL } from "@/lib/site";
import teacherImage from "@/assets/community-teacher.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | a4africa.org" },
      {
        name: "description",
        content:
          "Why a4africa.org exists: to make room for the good already happening across all 54 African nations.",
      },
      { property: "og:title", content: "About a4africa.org" },
      {
        property: "og:description",
        content:
          "Why a4africa.org exists: to make room for the good already happening across all 54 African nations.",
      },
      { property: "og:url", content: `${SITE_URL}/about` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/about` }],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: HeartHandshake,
    title: "The good, told honestly",
    body: "We publish true stories of generosity, courage, beauty, culture, and progress, shared by the people who witnessed them.",
  },
  {
    icon: Globe2,
    title: "Every nation, equally",
    body: "All 54 countries stand side by side. We never rank nations or treat one as more important than another.",
  },
  {
    icon: ShieldCheck,
    title: "A human editor, always",
    body: "Every submission is read and reviewed by a person before it appears. Nothing is published automatically.",
  },
];

function AboutPage() {
  return (
    <PageShell>
      <main>
        <PageIntro
          eyebrow="About a4africa.org"
          title={
            <>
              Making room for the good that is{" "}
              <span className="italic text-clay">already happening.</span>
            </>
          }
        >
          <p>
            Too often, the stories told about Africa are only about what is going wrong.
            a4africa.org is a place for the other side: the neighbour who helps, the teacher who
            stays late, the coastline at sunrise, the young founder solving a local problem.
          </p>
        </PageIntro>

        <section className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="text-[16px] leading-relaxed text-ink/75">
            <h2 className="font-display text-3xl font-semibold text-ink">
              Africa for Africa, by Africans.
            </h2>
            <p className="mt-5">
              The name says it plainly: <strong className="font-semibold text-ink">A4Africa</strong>
              . This is a publication built for the continent and shaped by its people. Anyone can
              share a story. Our editors check it, and if it reflects Africa at its best, honestly
              told, we publish it for the world to read and share.
            </p>
            <p className="mt-4">
              We are not here to hide real problems. We are here to make sure the good is seen too,
              because it is real, it is everywhere, and it deserves an audience.
            </p>
            <Button
              asChild
              className="mt-8 gap-2 rounded-full bg-moss px-6 text-cream hover:bg-moss/90"
            >
              <Link to="/submit">
                Share a story <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
          <figure>
            <img
              src={teacherImage}
              alt="A teacher painting with smiling children in an open-air classroom"
              className="aspect-[4/3] w-full rounded-2xl object-cover"
              loading="lazy"
            />
            <figcaption className="mt-2 text-xs text-ink/45">Illustration</figcaption>
          </figure>
        </section>

        <section className="grid gap-6 border-t border-ink/10 py-12 sm:grid-cols-3 sm:py-16">
          {values.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl bg-paper/70 p-6">
              <Icon className="size-6 text-clay" />
              <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </PageShell>
  );
}
