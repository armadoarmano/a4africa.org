import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, MapPin, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/site/PageShell";
import { ShareBar } from "@/components/site/ShareBar";
import { getPublishedStory } from "@/lib/public-stories.functions";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/stories/$storyId")({
  loader: async ({ params }) => {
    const story = await getPublishedStory({ data: { id: params.storyId } });
    if (!story) throw notFound();
    return story;
  },
  head: ({ loaderData }) => {
    const title = loaderData?.title ?? "Stories from Africa";
    const description =
      loaderData?.story.slice(0, 160) ?? "Stories of courage, care, and beauty from across Africa.";
    const url = `${SITE_URL}/stories/${loaderData?.id ?? ""}`;
    const imageUrl = loaderData?.image_url
      ? `${SITE_URL}${loaderData.image_url}`
      : `${SITE_URL}/og-image.jpg`;

    return {
      meta: [
        { title: `${title} | a4africa.org` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: imageUrl },
        { name: "twitter:image", content: imageUrl },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  errorComponent: StoryError,
  notFoundComponent: StoryNotFound,
  component: StoryPage,
});

function StoryError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 font-body text-ink">
      <div className="max-w-lg text-center">
        <h1 className="font-display text-4xl font-semibold">This story could not be loaded.</h1>
        <Button className="mt-6 bg-moss text-cream hover:bg-moss/90" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}

function StoryNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 font-body text-ink">
      <div className="max-w-lg text-center">
        <h1 className="font-display text-4xl font-semibold">This story is not available.</h1>
        <p className="mt-3 text-ink/65">It may be unpublished or no longer available to readers.</p>
        <Button asChild className="mt-6 bg-moss text-cream hover:bg-moss/90">
          <Link to="/">Explore a4africa.org</Link>
        </Button>
      </div>
    </main>
  );
}

function StoryPage() {
  const story = Route.useLoaderData();
  const date = new Date(story.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const url = `${SITE_URL}/stories/${story.id}`;

  return (
    <PageShell width="max-w-[1100px]">
      <article className="mx-auto max-w-[780px] py-8 sm:py-12">
        <Link
          to="/"
          hash="stories"
          className="inline-flex items-center gap-2 text-sm text-ink/55 hover:text-clay"
        >
          <ArrowLeft className="size-4" /> All stories
        </Link>
        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink/55">
          <span className="font-semibold text-clay">{story.category}</span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" />
            {story.location ? `${story.location}, ` : ""}
            {story.country}
          </span>
          <time dateTime={story.created_at}>{date}</time>
        </div>
        <h1 className="mt-5 font-display text-4xl font-semibold leading-tight sm:text-6xl">
          {story.title}
        </h1>
        <p className="mt-5 text-base text-ink/60">
          Shared by{" "}
          <span className="font-semibold text-ink">
            {story.contributor_name ?? "a community contributor"}
          </span>
        </p>
        {story.image_url && (
          <img
            src={story.image_url}
            alt={story.title}
            className="mt-8 aspect-[16/10] w-full rounded-xl bg-paper object-cover"
          />
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-6">
          <span className="flex items-center gap-2 text-sm font-medium text-moss">
            <CheckCircle2 className="size-4" /> Reviewed by the a4africa.org editors
          </span>
          <ShareBar url={url} title={story.title} />
        </div>
        <div className="mt-8 whitespace-pre-wrap text-[17px] leading-[1.85] text-ink/80">
          {story.story}
        </div>
        <div className="mt-12 rounded-2xl bg-moss p-6 text-cream sm:p-8">
          <h2 className="font-display text-2xl font-semibold">Seen something good lately?</h2>
          <p className="mt-2 text-sm text-cream/75">
            Share a good deed, a beautiful place, or someone making a difference near you.
          </p>
          <Button asChild className="mt-5 gap-2 rounded-full bg-gold text-ink hover:bg-gold/90">
            <Link to="/submit">
              Submit a story <Send className="size-4" />
            </Link>
          </Button>
        </div>
      </article>
    </PageShell>
  );
}
