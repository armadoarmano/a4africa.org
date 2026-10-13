import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  MapPin,
  PenLine,
  Send,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/site/PageShell";
import { africanCountries, storyCategories } from "@/lib/story-constants";
import { getPublishedStories } from "@/lib/public-stories.functions";
import { SITE_URL } from "@/lib/site";
import heroImage from "@/assets/featured-police-help.jpg";
import teacherImage from "@/assets/community-teacher.jpg";
import fishermanImage from "@/assets/cape-coast-fisherman.jpg";
import doctorImage from "@/assets/rwandan-doctor.jpg";

export const Route = createFileRoute("/")({
  loader: () => getPublishedStories(),
  head: () => ({
    meta: [
      { title: "a4africa.org | The good side of Africa" },
      {
        name: "description",
        content:
          "Discover approved good deeds, beautiful places, and inspiring people from across Africa.",
      },
      { property: "og:title", content: "a4africa.org | The good side of Africa" },
      {
        property: "og:description",
        content:
          "Discover approved good deeds, beautiful places, and inspiring people from across Africa.",
      },
      { property: "og:url", content: SITE_URL },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  errorComponent: HomeError,
  component: HomePage,
});

function HomeError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 font-body text-ink">
      <div className="max-w-lg text-center">
        <h1 className="font-display text-4xl font-semibold">The stories could not be loaded.</h1>
        <p className="mt-3 text-ink/65">Please try again in a moment.</p>
        <Button className="mt-6 bg-moss text-cream hover:bg-moss/90" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}

const steps = [
  {
    icon: PenLine,
    title: "Share what you saw",
    body: "Write a few honest paragraphs and add one photo.",
  },
  {
    icon: ShieldCheck,
    title: "An editor reviews it",
    body: "A real person checks every story before it goes live.",
  },
  {
    icon: Send,
    title: "The continent reads it",
    body: "Approved stories get their own page, ready to share.",
  },
];

function HomePage() {
  const stories = Route.useLoaderData();
  const [country, setCountry] = useState("All Africa");
  const [category, setCategory] = useState("All");

  const countriesWithStories = useMemo(
    () => new Set(stories.map((story) => story.country)),
    [stories],
  );
  const filtered = useMemo(
    () =>
      stories.filter(
        (story) =>
          (country === "All Africa" || story.country === country) &&
          (category === "All" || story.category === category),
      ),
    [stories, country, category],
  );

  return (
    <PageShell>
      <main>
        <section className="grid gap-10 border-b border-ink/10 py-10 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
              Across 54 nations · one shared continent
            </p>
            <h1 className="mt-4 font-display text-[2.75rem] font-semibold leading-[1.02] sm:text-7xl">
              Africa, seen through <span className="italic text-clay">its good.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/65 sm:text-lg">
              Stories of generous people, everyday courage, beautiful places, and a continent that
              deserves to be celebrated — told by the people who know it best.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                className="h-12 gap-2 rounded-full bg-moss px-6 text-cream hover:bg-moss/90"
              >
                <Link to="/submit">
                  Submit a story <Send className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-ink/15 bg-transparent px-6"
              >
                <a href="#stories">Read the stories</a>
              </Button>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-ink/10 pt-6">
              <div>
                <div className="font-display text-3xl font-semibold">{stories.length}</div>
                <p className="text-xs text-ink/55">
                  published {stories.length === 1 ? "story" : "stories"}
                </p>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold">
                  {countriesWithStories.size}
                  <span className="text-ink/35">/54</span>
                </div>
                <p className="text-xs text-ink/55">nations featured</p>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold">100%</div>
                <p className="text-xs text-ink/55">reviewed by an editor</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-[1.35fr_1fr] gap-3 sm:gap-4" aria-hidden="true">
            <img
              src={heroImage}
              alt=""
              className="row-span-3 h-full min-h-[340px] w-full rounded-2xl object-cover sm:min-h-[520px]"
              fetchPriority="high"
            />
            <img
              src={teacherImage}
              alt=""
              className="aspect-[4/3] w-full rounded-2xl object-cover"
              loading="lazy"
            />
            <img
              src={fishermanImage}
              alt=""
              className="aspect-[4/3] w-full rounded-2xl object-cover"
              loading="lazy"
            />
            <img
              src={doctorImage}
              alt=""
              className="aspect-[4/3] w-full rounded-2xl object-cover"
              loading="lazy"
            />
          </div>
        </section>

        <section id="stories" className="scroll-mt-6 py-10 sm:py-14">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                The good, published
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                Stories from across Africa
              </h2>
            </div>
            <label className="grid w-full gap-1.5 text-xs font-medium text-ink/55 sm:w-auto">
              Browse by country
              <select
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="h-11 rounded-md border border-ink/15 bg-paper px-3 text-sm text-ink outline-none focus:border-clay sm:min-w-56"
              >
                <option>All Africa</option>
                {africanCountries.map((item) => (
                  <option key={item} value={item}>
                    {item}
                    {countriesWithStories.has(item) ? " •" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            className="mt-6 flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter by story type"
          >
            {["All", ...storyCategories].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${category === item ? "border-clay bg-clay text-cream" : "border-ink/12 text-ink/65 hover:border-clay/60"}`}
              >
                {item}
              </button>
            ))}
          </div>

          {filtered.length ? (
            <div className="mt-8 grid gap-x-7 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((story) => (
                <article key={story.id} className="group min-w-0">
                  <Link to="/stories/$storyId" params={{ storyId: story.id }} className="block">
                    {story.image_url ? (
                      <img
                        src={story.image_url}
                        alt={story.title}
                        loading="lazy"
                        className="aspect-[4/3] w-full rounded-xl bg-paper object-cover"
                      />
                    ) : (
                      <div className="grid aspect-[4/3] place-items-center rounded-xl bg-paper text-sm text-ink/35">
                        A story from {story.country}
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50">
                      <span className="font-semibold text-clay">{story.category}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {story.location ? `${story.location}, ` : ""}
                        {story.country}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-semibold leading-tight transition-colors group-hover:text-clay">
                      {story.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink/65">
                      {story.story}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-xs text-ink/45">
                        {story.contributor_name
                          ? `By ${story.contributor_name}`
                          : "Community contributor"}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-moss">
                        Read{" "}
                        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-ink/10 bg-paper/50 px-6 py-12 sm:px-10">
              <Clock3 className="size-5 text-gold" />
              <h3 className="mt-4 font-display text-2xl font-semibold">
                {stories.length
                  ? "No published stories match this filter yet."
                  : "The first stories are being prepared."}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/65">
                {stories.length
                  ? "Be the first to share one from here."
                  : "Every story is reviewed before it appears here."}{" "}
                Share a good deed, a beautiful place, or someone making a difference.
              </p>
              <Button
                asChild
                className="mt-5 gap-2 rounded-full bg-moss text-cream hover:bg-moss/90"
              >
                <Link to="/submit">
                  Submit a story <Send className="size-4" />
                </Link>
              </Button>
            </div>
          )}
        </section>

        <section className="grid gap-6 border-t border-ink/10 py-12 sm:grid-cols-3 sm:py-16">
          {steps.map(({ icon: Icon, title, body }, index) => (
            <div key={title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-moss/10 text-moss">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-clay">Step {index + 1}</p>
                <h3 className="mt-1 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/60">{body}</p>
              </div>
            </div>
          ))}
        </section>

        <section
          id="about"
          className="grid gap-8 border-t border-ink/10 py-12 sm:grid-cols-2 sm:py-16"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
              Our promise
            </p>
            <h2 className="mt-3 max-w-md font-display text-3xl font-semibold">
              Every nation deserves to be seen fairly.
            </h2>
          </div>
          <div className="text-[15px] leading-relaxed text-ink/70">
            <p>
              a4africa.org celebrates the beauty, courage, generosity, culture, and creativity of
              African people. Every submission is reviewed by a human editor. Stories are never
              ranked by nation, and no country is treated as more important than another.
            </p>
            <p className="mt-4">
              The goal is simple: make room for the good that is already happening.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium">
              <span className="inline-flex items-center gap-2 text-moss">
                <CheckCircle2 className="size-4" /> Every story reviewed before publishing
              </span>
              <Link
                to="/about"
                className="inline-flex items-center gap-1 text-clay hover:underline"
              >
                Read our mission <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
