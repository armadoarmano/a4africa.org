import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const reviewSchema = z.object({
  storyId: z.string().uuid(),
  status: z.enum(["approved", "rejected", "pending"]),
  reviewNote: z.string().trim().max(1000).optional(),
});

const userSchema = z.object({ userId: z.string().uuid() });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });

  if (error || !data) throw new Error("You do not have administrator access.");
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      { data: stories, error: storiesError },
      { data: roles, error: rolesError },
      usersResult,
      { data: messages },
    ] = await Promise.all([
      supabaseAdmin
        .from("stories")
        .select(
          "id, title, country, location, category, story, image_path, status, review_note, submitted_by, contributor_name, created_at, reviewed_at",
        )
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("user_roles")
        .select("user_id, role, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin
        .from("contact_messages")
        .select("id, name, email, subject, message, handled, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (storiesError) throw new Error("The review queue could not be loaded.");
    if (rolesError) throw new Error("Administrator accounts could not be loaded.");
    if (usersResult.error) throw new Error("User accounts could not be loaded.");

    const profileIds = [...new Set((stories ?? []).map((story) => story.submitted_by))];
    const { data: profiles } = profileIds.length
      ? await supabaseAdmin.from("profiles").select("id, display_name").in("id", profileIds)
      : { data: [] as { id: string; display_name: string | null }[] };
    const profileById = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile.display_name]),
    );
    const roleByUserId = new Map((roles ?? []).map((role) => [role.user_id, role.role]));

    const storiesWithImages = await Promise.all(
      (stories ?? []).map(async (story) => {
        const imageResult = story.image_path
          ? await supabaseAdmin.storage
              .from("story-images")
              .createSignedUrl(story.image_path, 60 * 60)
          : { data: null };
        return {
          ...story,
          image_url: imageResult.data?.signedUrl ?? null,
          submitter_name: profileById.get(story.submitted_by) ?? story.contributor_name ?? null,
        };
      }),
    );

    return {
      messages: messages ?? [],
      stories: storiesWithImages,
      users: usersResult.data.users.map((user) => ({
        id: user.id,
        email: user.email ?? "No email",
        display_name:
          typeof user.user_metadata?.["display_name"] === "string"
            ? user.user_metadata["display_name"]
            : null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
        role: roleByUserId.get(user.id) ?? "user",
      })),
    };
  });

export const reviewStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => reviewSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: story, error } = await supabaseAdmin
      .from("stories")
      .update({
        status: data.status,
        review_note: data.reviewNote || null,
        reviewed_by: context.userId,
        reviewed_at: data.status === "pending" ? null : new Date().toISOString(),
      })
      .eq("id", data.storyId)
      .select("id, status, review_note, reviewed_at")
      .single();

    if (error || !story) throw new Error("The story review could not be saved.");
    return story;
  });

export const grantAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => userSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error("The administrator role could not be granted.");
    return { ok: true };
  });

export const revokeAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => userSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.userId === context.userId)
      throw new Error("You cannot remove your own administrator access.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countError) throw new Error("Administrator accounts could not be checked.");
    if ((count ?? 0) <= 1) throw new Error("Keep at least one administrator account active.");

    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw new Error("The administrator role could not be removed.");
    return { ok: true };
  });
const messageSchema = z.object({ messageId: z.string().uuid(), handled: z.boolean() });
const deleteSchema = z.object({ storyId: z.string().uuid() });

export const setMessageHandled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => messageSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("contact_messages")
      .update({ handled: data.handled })
      .eq("id", data.messageId);
    if (error) throw new Error("The message could not be updated.");
    return { ok: true };
  });

export const deleteStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => deleteSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: story } = await supabaseAdmin
      .from("stories")
      .select("image_path")
      .eq("id", data.storyId)
      .maybeSingle();
    const { error } = await supabaseAdmin.from("stories").delete().eq("id", data.storyId);
    if (error) throw new Error("The story could not be deleted.");
    if (story?.image_path)
      await supabaseAdmin.storage.from("story-images").remove([story.image_path]);
    return { ok: true };
  });
