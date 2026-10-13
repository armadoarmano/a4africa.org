import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageIntro, PageShell } from "@/components/site/PageShell";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/guidelines")({
  head: () => ({
    meta: [
      { title: "Submission guidelines | a4africa.org" },
      {
        name: "description",
        content:
          "What a4africa.org publishes, what we don't, and how to submit a story that gets approved.",
      },
      { property: "og:title", content: "Submission guidelines | a4africa.org" },
      { property: "og:url", content: `${SITE_URL}/guidelines` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/guidelines` }],
  }),
  component: GuidelinesPage,
});

const yes = [
  "Good deeds: people helping people, often quietly",
  "Communities working together to solve a problem",
  "Beautiful places: landscapes, cities, architecture, nature",
  "Culture: food, music, craft, language, celebrations",
  "Environment: conservation, clean-ups, green innovation",
  "Progress: local inventions, businesses, schools, and clinics",
];
const no = [
  "Hate speech, or content that demeans any nation, tribe, or group",
  "Content that humiliates the people it shows",
  "Unverified accusations against named people",
  "Political campaigning or party promotion",
  "Advertising, fundraising appeals, or links to sell things",
  "Photos you don't have the right to share",
];
const tips = [
  {
    title: "Tell us who, where, and when",
    body: "Name the town or place and roughly when it happened. Details help readers trust the story and help editors verify it.",
  },
  {
    title: "Write it in your own words",
    body: "Don't copy articles or social posts. A few honest paragraphs beat a polished press release.",
  },
  {
    title: "Use your own photo",
    body: "Upload a photo you took, or one you have clear permission to use. JPG, PNG, or WebP, up to 10 MB.",
  },
  {
    title: "Ask before you show faces",
    body: "If people, especially children, are clearly identifiable, make sure they (or a parent or guardian) are happy to be published.",
  },
];

function GuidelinesPage() {
  return (
    <PageShell>
      <main>
        <PageIntro
          eyebrow="Submission guidelines"
          title={
            <>
              Only the good, <span className="italic text-clay">told honestly.</span>
            </>
          }
        >
          <p>
            Every story is reviewed by a human editor. These guidelines explain what we look for so
            your story has the best chance of being published.
          </p>
        </PageIntro>

        <section className="grid gap-6 py-12 sm:py-16 md:grid-cols-2">
          <div className="rounded-2xl bg-moss p-6 text-cream sm:p-8">
            <h2 className="font-display text-2xl font-semibold">We publish</h2>
            <ul className="mt-5 grid gap-3 text-sm leading-relaxed text-cream/85">
              {yes.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-paper/70 p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold">We don't publish</h2>
            <ul className="mt-5 grid gap-3 text-sm leading-relaxed text-ink/70">
              {no.map((item) => (
                <li key={item} className="flex gap-3">
                  <X className="mt-0.5 size-4 shrink-0 text-clay" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-ink/10 py-12 sm:py-16">
          <h2 className="font-display text-3xl font-semibold">Tips for a great submission</h2>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {tips.map((tip, index) => (
              <div key={tip.title} className="flex gap-4">
                <span className="font-display text-3xl font-semibold text-gold">{index + 1}</span>
                <div>
                  <h3 className="font-semibold">{tip.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink/65">{tip.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-ink/10 py-12 sm:py-16">
          <h2 className="font-display text-3xl font-semibold">What happens after you submit</h2>
          <ol className="mt-6 grid gap-4 text-[15px] leading-relaxed text-ink/70 sm:grid-cols-3">
            <li className="rounded-2xl bg-paper/70 p-5">
              <strong className="block font-display text-lg text-ink">Pending</strong>Your story is
              private. Only you and the editors can see it, and you can still edit or withdraw it.
            </li>
            <li className="rounded-2xl bg-paper/70 p-5">
              <strong className="block font-display text-lg text-ink">Approved</strong>It's
              published on a4africa.org with your name as contributor, and gets its own page you can
              share.
            </li>
            <li className="rounded-2xl bg-paper/70 p-5">
              <strong className="block font-display text-lg text-ink">Not approved</strong>The
              editor may leave a note explaining why. You're welcome to submit again.
            </li>
          </ol>
          <p className="mt-6 text-sm text-ink/55">
            By submitting, you confirm the story is true to the best of your knowledge and that you
            have the right to share the photo. You keep ownership of your words and photo, and you
            give a4africa.org permission to publish and share them.
          </p>
          <Button asChild className="mt-8 rounded-full bg-moss px-6 text-cream hover:bg-moss/90">
            <Link to="/submit">Submit a story</Link>
          </Button>
        </section>
      </main>
    </PageShell>
  );
}
