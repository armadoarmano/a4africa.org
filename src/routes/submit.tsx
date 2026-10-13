import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock3,
  ImagePlus,
  MessageSquareText,
  Pencil,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/site/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { africanCountries, storyCategories } from "@/lib/story-constants";

const clientStorySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Add a title with at least 3 characters.")
    .max(140, "Keep the title under 140 characters."),
  country: z.enum(africanCountries),
  location: z.string().trim().max(120, "Keep the location under 120 characters."),
  category: z.enum(storyCategories),
  story: z
    .string()
    .trim()
    .min(40, "Tell us a little more about what happened (at least 40 characters).")
    .max(8000, "Keep the story under 8,000 characters."),
});

type Country = (typeof africanCountries)[number];
type Category = (typeof storyCategories)[number];
type Submission = {
  id: string;
  title: string;
  country: string;
  location: string | null;
  category: string;
  story: string;
  status: string;
  review_note: string | null;
  image_path: string | null;
  created_at: string;
};

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit a story | a4africa.org" },
      {
        name: "description",
        content:
          "Submit a good deed, beautiful place, or inspiring person for a4africa.org editorial review.",
      },
      { property: "og:title", content: "Submit a story | a4africa.org" },
      {
        property: "og:description",
        content:
          "Submit a good deed, beautiful place, or inspiring person for a4africa.org editorial review.",
      },
    ],
  }),
  component: SubmitPage,
});

const statusStyle: Record<string, string> = {
  pending: "bg-gold/25 text-ink",
  approved: "bg-moss/15 text-moss",
  rejected: "bg-clay/15 text-clay",
};
const statusLabel: Record<string, string> = {
  pending: "In review",
  approved: "Published",
  rejected: "Not approved",
};

function SubmitPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState<Country>("Nigeria");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<Category>("Good Deed");
  const [story, setStory] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Submission | null>(null);

  const loadSubmissions = async (id: string) => {
    const { data: rows } = await supabase
      .from("stories")
      .select(
        "id, title, country, location, category, story, status, review_note, image_path, created_at",
      )
      .eq("submitted_by", id)
      .order("created_at", { ascending: false });
    setSubmissions((rows as Submission[] | null) ?? []);
  };

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        await navigate({ to: "/auth", search: { next: "/submit" } });
        return;
      }
      setUserId(user.id);
      setReady(true);
      await loadSubmissions(user.id);
    });
  }, [navigate]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const chooseImage = (file: File | undefined) => {
    if (!file) return;
    if (
      !new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP photo under 10 MB.");
      return;
    }
    setError("");
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const submitStory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const parsed = clientStorySchema.safeParse({ title, country, location, category, story });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the story details.");
      return;
    }
    if (!image) {
      setError("Add one photo so readers can see the story.");
      return;
    }
    if (!agree) {
      setError("Please confirm the story is true and you have the right to share the photo.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      Object.entries(parsed.data).forEach(([key, value]) => body.append(key, value));
      body.append("image", image);
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/stories/submit", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionData.session?.access_token ?? ""}` },
        body,
      });
      const result = (await response.json()) as { error?: string; story?: Submission };
      if (!response.ok || !result.story) {
        setError(result.error ?? "The story could not be submitted.");
        return;
      }
      setSubmissions((current) => [
        {
          ...result.story!,
          location: parsed.data.location || null,
          story: parsed.data.story,
          image_path: null,
        },
        ...current,
      ]);
      setTitle("");
      setLocation("");
      setStory("");
      setImage(null);
      setPreviewUrl(null);
      setAgree(false);
      setSuccess(
        "Thank you! Your story is safely in the editorial review queue. You'll see its status on the right.",
      );
      if (userId) void loadSubmissions(userId);
    } catch {
      setError("The story could not be submitted. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async (item: Submission) => {
    if (!window.confirm(`Withdraw "${item.title}"? This permanently deletes the submission.`))
      return;
    const { error: deleteError } = await supabase.from("stories").delete().eq("id", item.id);
    if (deleteError) {
      setError("The story could not be withdrawn.");
      return;
    }
    if (item.image_path) await supabase.storage.from("story-images").remove([item.image_path]);
    setSubmissions((current) => current.filter((row) => row.id !== item.id));
  };

  if (!ready) {
    return (
      <PageShell>
        <main className="py-24 text-center text-sm text-ink/55">Opening the submission desk…</main>
      </PageShell>
    );
  }

  const select =
    "h-11 rounded-md border border-ink/15 bg-paper px-3 font-normal outline-none focus:border-clay";

  return (
    <PageShell width="max-w-[1280px]">
      <div className="grid gap-12 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
                The submission desk
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.02] sm:text-6xl">
                Tell the story of <span className="italic text-clay">good.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/65">
                Share a deed, place, or person that shows Africa at its best. It stays private until
                an editor has reviewed it.{" "}
                <Link
                  to="/guidelines"
                  className="font-medium text-clay underline-offset-4 hover:underline"
                >
                  Read the guidelines
                </Link>
                .
              </p>
            </div>
            <div className="hidden size-14 shrink-0 place-items-center rounded-full bg-moss/10 text-moss sm:grid">
              <ShieldCheck className="size-7" />
            </div>
          </div>
          <form className="mt-10 grid gap-6" onSubmit={submitStory}>
            <label className="grid gap-2 text-sm font-semibold">
              Story title
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={140}
                placeholder="Give the story a hopeful title"
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Country
                <select
                  value={country}
                  onChange={(event) => setCountry(event.target.value as Country)}
                  className={select}
                >
                  {africanCountries.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                City or place{" "}
                <Input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  maxLength={120}
                  placeholder="Where did it happen?"
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold">
              Story type
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as Category)}
                className={select}
              >
                {storyCategories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              What happened?
              <Textarea
                value={story}
                onChange={(event) => setStory(event.target.value)}
                maxLength={8000}
                placeholder="Tell us what happened, who was involved, and why it deserves to be seen."
                className="min-h-44 bg-paper"
              />
              <span className="text-right text-xs font-normal text-ink/40">
                {story.length.toLocaleString()}/8,000
              </span>
            </label>
            <div className="grid gap-2 text-sm font-semibold">
              Photo
              <label className="group relative flex min-h-52 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-ink/20 bg-paper/70 transition-colors hover:border-clay">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Selected story preview"
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-3 px-4 text-center text-ink/45">
                    <ImagePlus className="size-8 text-clay" />
                    <span>Choose one JPG, PNG, or WebP photo</span>
                    <span className="text-xs">Maximum 10 MB · use your own photo</span>
                  </span>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => chooseImage(event.target.files?.[0])}
                />
              </label>
              {previewUrl && (
                <button
                  type="button"
                  className="justify-self-start text-xs font-normal text-clay hover:underline"
                  onClick={() => {
                    setImage(null);
                    setPreviewUrl(null);
                  }}
                >
                  Remove photo
                </button>
              )}
            </div>
            <label className="flex items-start gap-3 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={agree}
                onChange={(event) => setAgree(event.target.checked)}
                className="mt-1 size-4 accent-[var(--color-moss)]"
              />
              <span>
                This story is true to the best of my knowledge, I have the right to share the photo,
                and anyone clearly shown is happy to be published.
              </span>
            </label>
            {error && (
              <p role="alert" className="rounded-xl bg-clay/10 p-4 text-sm text-clay">
                {error}
              </p>
            )}
            {success && (
              <p
                role="status"
                className="flex items-center gap-2 rounded-xl bg-moss/10 p-4 text-sm text-moss"
              >
                <CheckCircle2 className="size-4 shrink-0" /> {success}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-6">
              <span className="flex items-center gap-2 text-xs text-ink/50">
                <Clock3 className="size-4 text-gold" /> Every story is reviewed before publishing.
              </span>
              <Button
                type="submit"
                className="gap-2 rounded-full bg-moss px-6 text-cream hover:bg-moss/90"
                disabled={busy}
              >
                {busy ? "Sending for review…" : "Send for review"} <Send className="size-4" />
              </Button>
            </div>
          </form>
        </section>

        <aside className="lg:pt-16">
          <div className="rounded-2xl bg-moss p-6 text-cream">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Your promise to readers
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold">
              Only the good, told honestly.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/75">
              a4africa.org does not rank countries or publish hate, humiliation, unverified
              accusations, or content that diminishes Africa and its people.
            </p>
          </div>
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">Your submissions</h2>
              <span className="text-xs text-clay">{submissions.length}</span>
            </div>
            {submissions.length ? (
              <div className="mt-4 grid gap-3">
                {submissions.map((item) => (
                  <div key={item.id} className="rounded-xl border border-ink/10 bg-paper/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusStyle[item.status] ?? "bg-ink/10"}`}
                      >
                        {statusLabel[item.status] ?? item.status}
                      </span>
                      <span className="text-xs text-ink/40">
                        {new Date(item.created_at).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold leading-tight">
                      {item.status === "approved" ? (
                        <Link
                          to="/stories/$storyId"
                          params={{ storyId: item.id }}
                          className="hover:text-clay"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        item.title
                      )}
                    </h3>
                    <p className="mt-1 text-xs text-ink/50">
                      {item.country} · {item.category}
                    </p>
                    {item.review_note && item.status !== "pending" && (
                      <p className="mt-3 flex gap-2 rounded-lg bg-cream p-3 text-xs leading-relaxed text-ink/70">
                        <MessageSquareText className="size-4 shrink-0 text-clay" />
                        <span>
                          <strong className="font-semibold">Editor's note:</strong>{" "}
                          {item.review_note}
                        </span>
                      </p>
                    )}
                    {item.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 border-ink/15 bg-transparent text-xs"
                          onClick={() => setEditing(item)}
                        >
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 text-xs text-clay hover:text-clay"
                          onClick={() => void withdraw(item)}
                        >
                          <Trash2 className="size-3.5" /> Withdraw
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-ink/55">
                Your submitted stories will appear here with their review status.
              </p>
            )}
          </div>
        </aside>
      </div>

      {editing && (
        <EditDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setSubmissions((current) =>
              current.map((row) => (row.id === updated.id ? updated : row)),
            );
            setEditing(null);
          }}
        />
      )}
    </PageShell>
  );
}

function EditDialog({
  item,
  onClose,
  onSaved,
}: {
  item: Submission;
  onClose: () => void;
  onSaved: (updated: Submission) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [country, setCountry] = useState(item.country as Country);
  const [location, setLocation] = useState(item.location ?? "");
  const [category, setCategory] = useState(item.category as Category);
  const [story, setStory] = useState(item.story);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const select =
    "h-11 rounded-md border border-ink/15 bg-paper px-3 font-normal outline-none focus:border-clay";

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const parsed = clientStorySchema.safeParse({ title, country, location, category, story });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the story details.");
      return;
    }
    setBusy(true);
    const { data, error: updateError } = await supabase
      .from("stories")
      .update({ ...parsed.data, location: parsed.data.location || null })
      .eq("id", item.id)
      .eq("status", "pending")
      .select(
        "id, title, country, location, category, story, status, review_note, image_path, created_at",
      )
      .maybeSingle();
    setBusy(false);
    if (updateError || !data) {
      setError("The story could not be updated. It may already have been reviewed.");
      return;
    }
    onSaved(data as Submission);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit story"
    >
      <form
        onSubmit={save}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-cream p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold">Edit your story</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>
        <p className="mt-1 text-sm text-ink/55">
          You can edit while the story is still in review. The photo stays the same.
        </p>
        <div className="mt-6 grid gap-5">
          <label className="grid gap-2 text-sm font-semibold">
            Story title
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Country
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value as Country)}
                className={select}
              >
                {africanCountries.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              City or place
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={120}
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Story type
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={select}
            >
              {storyCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            What happened?
            <Textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              maxLength={8000}
              className="min-h-48 bg-paper"
            />
          </label>
          {error && (
            <p role="alert" className="rounded-xl bg-clay/10 p-3 text-sm text-clay">
              {error}
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-ink/10 pt-5">
          <Button
            type="button"
            variant="outline"
            className="border-ink/15 bg-transparent"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-moss text-cream hover:bg-moss/90" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
