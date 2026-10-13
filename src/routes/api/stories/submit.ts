import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";
import { africanCountries, storyCategories } from "@/lib/story-constants";
import { sendAdminAlert } from "@/lib/notify.server";

const storySchema = z.object({
  title: z.string().trim().min(3).max(140),
  country: z.enum(africanCountries),
  location: z.string().trim().max(120).optional(),
  category: z.enum(storyCategories),
  story: z.string().trim().min(40).max(8000),
});

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function isSupportedImage(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png")
    return bytes
      .slice(0, 8)
      .every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (type === "image/webp")
    return (
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
    );
  return false;
}

function createServerClient(url: string, key: string, token: string) {
  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const Route = createFileRoute("/api/stories/submit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token || token.split(".").length !== 3)
          return Response.json({ error: "Please sign in before submitting." }, { status: 401 });

        const supabaseUrl = process.env["SUPABASE_URL"];
        const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!supabaseUrl || !publishableKey)
          return Response.json(
            { error: "The submission service is not configured." },
            { status: 500 },
          );

        const supabase = createServerClient(supabaseUrl, publishableKey, token);
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (claimsError || !userId)
          return Response.json({ error: "Your sign-in session has expired." }, { status: 401 });

        const formData = await request.formData();
        const parsed = storySchema.safeParse({
          title: formData.get("title"),
          country: formData.get("country"),
          location: formData.get("location") || undefined,
          category: formData.get("category"),
          story: formData.get("story"),
        });
        if (!parsed.success)
          return Response.json(
            { error: "Please check the story details and try again." },
            { status: 400 },
          );

        const image = formData.get("image");
        if (!(image instanceof File) || image.size === 0)
          return Response.json({ error: "Please add a photo to the story." }, { status: 400 });
        if (image.size > 10 * 1024 * 1024 || !imageMimeTypes.has(image.type))
          return Response.json(
            { error: "Photos must be JPG, PNG, or WebP files under 10 MB." },
            { status: 400 },
          );

        const imageBytes = new Uint8Array(await image.arrayBuffer());
        if (!isSupportedImage(imageBytes, image.type))
          return Response.json(
            { error: "That photo could not be verified as a supported image." },
            { status: 400 },
          );

        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", userId)
          .maybeSingle();
        const metadata = (claimsData?.claims?.["user_metadata"] ?? {}) as Record<string, unknown>;
        const metaName = [metadata["display_name"], metadata["full_name"], metadata["name"]].find(
          (value) => typeof value === "string" && value.trim(),
        );
        const contributorName =
          (
            profile?.display_name?.trim() ||
            (typeof metaName === "string" ? metaName.trim() : "") ||
            null
          )?.slice(0, 80) ?? null;

        const extension =
          image.type === "image/jpeg" ? "jpg" : image.type === "image/png" ? "png" : "webp";
        const imagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("story-images")
          .upload(imagePath, image, { contentType: image.type, upsert: false });
        if (uploadError)
          return Response.json(
            { error: "The photo could not be uploaded. Please try again." },
            { status: 500 },
          );

        const { data: story, error: insertError } = await supabase
          .from("stories")
          .insert({
            submitted_by: userId,
            contributor_name: contributorName,
            title: parsed.data.title,
            country: parsed.data.country,
            location: parsed.data.location || null,
            category: parsed.data.category,
            story: parsed.data.story,
            image_path: imagePath,
          })
          .select("id, title, country, category, status, created_at")
          .single();

        if (insertError || !story) {
          await supabase.storage.from("story-images").remove([imagePath]);
          return Response.json(
            { error: "The story could not be saved. Please try again." },
            { status: 500 },
          );
        }

        const siteUrl = new URL(request.url).origin;
        await sendAdminAlert(
          `New story for review: ${parsed.data.title}`,
          `${contributorName ?? "A contributor"} submitted a ${parsed.data.category} story from ${parsed.data.location ? `${parsed.data.location}, ` : ""}${parsed.data.country}.\n\nReview it on the admin desk: ${siteUrl}/admin`,
        );

        return Response.json({ story: { ...story, review_note: null } }, { status: 201 });
      },
    },
  },
});
