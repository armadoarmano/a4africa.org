import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const storyIdSchema = z.object({ id: z.string().uuid() });

async function withPublicImageUrl<T extends { id: string; image_path: string | null }>(story: T) {
  const { image_path: imagePath, ...publicStory } = story;
  return {
    ...publicStory,
    image_url: imagePath ? `/api/public/stories/${story.id}/image` : null,
  };
}

export const getPublishedStories = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicStoriesClient } = await import("@/lib/public-stories.server");
  const supabase = getPublicStoriesClient();
  const { data, error } = await supabase
    .from("stories")
    .select(
      "id, title, country, location, category, story, image_path, contributor_name, created_at",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error("Published stories could not be loaded.");

  return Promise.all((data ?? []).map(withPublicImageUrl));
});

export const getPublishedStory = createServerFn({ method: "GET" })
  .inputValidator((input) => storyIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { getPublicStoriesClient } = await import("@/lib/public-stories.server");
    const supabase = getPublicStoriesClient();
    const { data: story, error } = await supabase
      .from("stories")
      .select(
        "id, title, country, location, category, story, image_path, contributor_name, created_at",
      )
      .eq("id", data.id)
      .eq("status", "approved")
      .maybeSingle();

    if (error) throw new Error("This published story could not be loaded.");
    if (!story) return null;

    return withPublicImageUrl(story);
  });
