import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const storyIdSchema = z.string().uuid();

export const Route = createFileRoute("/api/public/stories/$storyId/image")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const parsedId = storyIdSchema.safeParse(params.storyId);
        if (!parsedId.success) return new Response("Not found", { status: 404 });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: story, error } = await supabaseAdmin
            .from("stories")
            .select("image_path")
            .eq("id", parsedId.data)
            .eq("status", "approved")
            .maybeSingle();

          if (error || !story?.image_path) return new Response("Not found", { status: 404 });

          const { data: signedImage, error: imageError } = await supabaseAdmin.storage
            .from("story-images")
            .createSignedUrl(story.image_path, 60 * 60);

          if (imageError || !signedImage?.signedUrl)
            return new Response("Not found", { status: 404 });

          return Response.redirect(signedImage.signedUrl, 302);
        } catch {
          return new Response("Image unavailable", { status: 503 });
        }
      },
    },
  },
});
