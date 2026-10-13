import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Inbox,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { AfricaMark } from "@/components/site/AfricaMark";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteStory,
  getAdminDashboard,
  grantAdminRole,
  revokeAdminRole,
  reviewStory,
  setMessageHandled,
} from "@/lib/admin.functions";

type DashboardData = Awaited<ReturnType<typeof getAdminDashboard>>;
type Story = DashboardData["stories"][number];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard | a4africa.org" },
      {
        name: "description",
        content: "Review a4africa.org submissions and manage administrator access.",
      },
      { property: "og:title", content: "Admin dashboard | a4africa.org" },
      {
        property: "og:description",
        content: "Review a4africa.org submissions and manage administrator access.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const loadDashboard = useServerFn(getAdminDashboard);
  const saveReview = useServerFn(reviewStory);
  const addAdmin = useServerFn(grantAdminRole);
  const removeAdmin = useServerFn(revokeAdminRole);
  const markMessage = useServerFn(setMessageHandled);
  const removeStory = useServerFn(deleteStory);
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    setError("");
    try {
      setData(await loadDashboard());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The dashboard could not be loaded.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const pendingCount = useMemo(
    () => data?.stories.filter((story) => story.status === "pending").length ?? 0,
    [data],
  );
  const visibleStories = useMemo(
    () => data?.stories.filter((story) => filter === "all" || story.status === filter) ?? [],
    [data, filter],
  );

  const openStory = (story: Story) => {
    setSelectedStory(story);
    setNote(story.review_note ?? "");
    setNotice("");
  };
  const updateReview = async (status: "approved" | "rejected" | "pending") => {
    if (!selectedStory) return;
    setBusy(true);
    setError("");
    try {
      await saveReview({ data: { storyId: selectedStory.id, status, reviewNote: note } });
      setSelectedStory(null);
      setNotice(
        status === "approved"
          ? "Story approved and ready for readers."
          : status === "rejected"
            ? "Story moved to rejected."
            : "Story returned to the review queue.",
      );
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The review could not be saved.");
      setBusy(false);
    }
  };

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    setBusy(true);
    setError("");
    try {
      if (isAdmin) await removeAdmin({ data: { userId } });
      else await addAdmin({ data: { userId } });
      await refresh();
      setNotice(isAdmin ? "Administrator access removed." : "Administrator access granted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The account change could not be saved.");
      setBusy(false);
    }
  };

  const toggleMessage = async (messageId: string, handled: boolean) => {
    setError("");
    try {
      await markMessage({ data: { messageId, handled } });
      setData((current) =>
        current
          ? {
              ...current,
              messages: current.messages.map((m) => (m.id === messageId ? { ...m, handled } : m)),
            }
          : current,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The message could not be updated.");
    }
  };

  const deleteSelected = async () => {
    if (
      !selectedStory ||
      !window.confirm(`Permanently delete "${selectedStory.title}" and its photo?`)
    )
      return;
    setBusy(true);
    setError("");
    try {
      await removeStory({ data: { storyId: selectedStory.id } });
      setSelectedStory(null);
      setNotice("Story deleted.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The story could not be deleted.");
      setBusy(false);
    }
  };

  const openMessages = data?.messages.filter((m) => !m.handled).length ?? 0;

  const signOut = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/", replace: true });
  };

  return (
    <main className="min-h-screen bg-cream font-body text-ink antialiased">
      <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-6">
          <Link to="/" className="flex items-center gap-3">
            <AfricaMark className="h-14 w-auto" title="" />
            <span className="font-display text-xl tracking-tight">
              a4africa<span className="text-clay">.org</span>
            </span>
            <span className="hidden border-l border-ink/15 pl-3 text-xs uppercase tracking-[0.16em] text-ink/45 sm:inline">
              Admin desk
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="gap-2 text-ink/65">
              <Link to="/">
                <ExternalLink className="size-4" />{" "}
                <span className="hidden sm:inline">View site</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void refresh()}
              disabled={busy}
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={busy ? "size-4 animate-spin" : "size-4"} />
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-ink/65" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </header>

        <section className="flex flex-wrap items-end justify-between gap-6 py-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
              Editorial control room
            </p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-none sm:text-6xl">
              Keep the good <span className="italic text-clay">honest.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/65">
              Review every submission with care, publish what reflects Africa at its best, and keep
              the standards clear for every country.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-moss px-5 py-4 text-cream">
            <Clock3 className="size-5 text-gold" />
            <div>
              <div className="font-display text-3xl font-semibold">{pendingCount}</div>
              <div className="text-xs text-cream/70">waiting for review</div>
            </div>
          </div>
        </section>
        {notice && (
          <p
            role="status"
            className="mb-6 flex items-center gap-2 rounded-xl bg-moss/10 p-4 text-sm text-moss"
          >
            <CheckCircle2 className="size-4" />
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-6 rounded-xl bg-clay/10 p-4 text-sm text-clay">
            {error}
          </p>
        )}
        {!data && !error && (
          <div className="rounded-2xl bg-paper p-8 text-sm text-ink/55">
            Loading the editorial desk…
          </div>
        )}
        {data && (
          <>
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Pending stories" value={pendingCount} tone="bg-gold/20" />
              <Stat label="Unread messages" value={openMessages} tone="bg-ink/5" />
              <Stat
                label="Approved stories"
                value={data.stories.filter((story) => story.status === "approved").length}
                tone="bg-moss/10"
              />
              <Stat
                label="Administrator accounts"
                value={data.users.filter((user) => user.role === "admin").length}
                tone="bg-clay/10"
              />
            </section>
            <section className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                      The queue
                    </p>
                    <h2 className="mt-2 font-display text-3xl font-semibold">Story submissions</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["pending", "approved", "rejected", "all"] as const).map((item) => (
                      <Button
                        key={item}
                        size="sm"
                        variant="ghost"
                        onClick={() => setFilter(item)}
                        className={
                          filter === item
                            ? "rounded-full bg-clay text-cream hover:bg-clay/90"
                            : "rounded-full border border-ink/10 text-ink/65"
                        }
                      >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  {visibleStories.length ? (
                    visibleStories.map((story) => (
                      <button
                        type="button"
                        key={story.id}
                        onClick={() => openStory(story)}
                        className="grid gap-4 rounded-2xl border border-ink/10 bg-paper/60 p-4 text-left transition-colors hover:border-clay/50 sm:grid-cols-[150px_1fr_auto] sm:items-center"
                      >
                        {story.image_url ? (
                          <img
                            src={story.image_url}
                            alt={story.title}
                            className="aspect-[4/3] w-full rounded-xl object-cover sm:w-[150px]"
                          />
                        ) : (
                          <div className="grid aspect-[4/3] w-full place-items-center rounded-xl bg-ink/5 text-xs text-ink/40 sm:w-[150px]">
                            No photo
                          </div>
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink/50">
                            <span className="rounded-full bg-clay/15 px-2 py-1 font-semibold uppercase tracking-[0.1em] text-clay">
                              {story.status}
                            </span>
                            <span>
                              {story.country} · {story.category}
                            </span>
                          </div>
                          <h3 className="mt-2 font-display text-xl font-semibold leading-tight">
                            {story.title}
                          </h3>
                          <p className="mt-1 text-sm text-ink/55">
                            {story.submitter_name ?? "a4africa.org contributor"} ·{" "}
                            {new Date(story.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ExternalLink className="hidden size-4 text-ink/35 sm:block" />
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-paper/60 p-8 text-sm text-ink/55">
                      No stories in this view.
                    </div>
                  )}
                </div>
              </div>
              <aside>
                <div className="rounded-2xl bg-moss p-6 text-cream">
                  <div className="flex items-center gap-2 text-gold">
                    <ShieldCheck className="size-5" />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                      Review standard
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-cream/75">
                    Approve stories that celebrate good deeds, people, places, culture, and progress
                    across Africa. Reject hate, humiliation, unverified accusations, and content
                    that diminishes the continent.
                  </p>
                </div>
                <div className="mt-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                        Access
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-semibold">Administrators</h2>
                    </div>
                    <UserPlus className="size-5 text-clay" />
                  </div>
                  <div className="mt-4 grid gap-3">
                    {data.users.map((user) => {
                      const isAdmin = user.role === "admin";
                      return (
                        <div
                          key={user.id}
                          className="rounded-xl border border-ink/10 bg-paper/60 p-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {user.display_name || user.email}
                            </p>
                            {user.display_name && (
                              <p className="truncate text-xs text-ink/50">{user.email}</p>
                            )}
                            <p className="mt-1 text-[11px] text-ink/40">
                              {isAdmin ? "Administrator" : "Contributor"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={isAdmin ? "outline" : "default"}
                            className={
                              isAdmin
                                ? "mt-3 w-full border-ink/15 bg-transparent text-ink"
                                : "mt-3 w-full bg-moss text-cream hover:bg-moss/90"
                            }
                            onClick={() => void toggleAdmin(user.id, isAdmin)}
                            disabled={busy}
                          >
                            {isAdmin ? "Remove admin access" : "Make administrator"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </section>
            <section className="mt-14 border-t border-ink/10 pt-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                    Inbox
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-semibold">Contact messages</h2>
                </div>
                <Inbox className="size-6 text-clay" />
              </div>
              {data.messages.length ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {data.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-2xl border p-5 ${m.handled ? "border-ink/5 bg-paper/30 opacity-70" : "border-ink/10 bg-paper/70"}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{m.name}</p>
                          <a
                            href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? "Your message to a4africa.org"}`)}`}
                            className="text-sm text-clay hover:underline"
                          >
                            {m.email}
                          </a>
                        </div>
                        <span className="text-xs text-ink/40">
                          {new Date(m.created_at).toLocaleString("en-GB")}
                        </span>
                      </div>
                      {m.subject && <p className="mt-3 text-sm font-semibold">{m.subject}</p>}
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/70">
                        {m.message}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button
                          asChild
                          size="sm"
                          className="gap-1.5 bg-moss text-cream hover:bg-moss/90"
                        >
                          <a
                            href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? "Your message to a4africa.org"}`)}`}
                          >
                            <Mail className="size-4" /> Reply
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-ink/15 bg-transparent"
                          onClick={() => void toggleMessage(m.id, !m.handled)}
                        >
                          {m.handled ? "Mark as unread" : "Mark as done"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-paper/60 p-8 text-sm text-ink/55">
                  No messages yet. Messages from the Contact page appear here.
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {selectedStory && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Review story"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-cream p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                  {selectedStory.country} · {selectedStory.category}
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">
                  {selectedStory.title}
                </h2>
                <p className="mt-2 text-sm text-ink/50">
                  Submitted by {selectedStory.submitter_name ?? "a4africa.org contributor"} on{" "}
                  {new Date(selectedStory.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedStory(null)}
                aria-label="Close review"
              >
                <X />
              </Button>
            </div>
            {selectedStory.image_url && (
              <img
                src={selectedStory.image_url}
                alt={selectedStory.title}
                className="mt-6 max-h-80 w-full rounded-xl object-cover"
              />
            )}
            <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/75">
              {selectedStory.story}
            </p>
            <label className="mt-6 grid gap-2 text-sm font-semibold">
              Editorial note
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={1000}
                placeholder="Add context for the contributor or your review record."
                className="min-h-24 bg-paper"
              />
            </label>
            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-ink/10 pt-5">
              <Button
                variant="ghost"
                className="mr-auto text-clay hover:text-clay"
                onClick={() => void deleteSelected()}
                disabled={busy}
              >
                <Trash2 /> Delete
              </Button>
              <Button
                variant="outline"
                className="border-ink/15 bg-transparent text-ink"
                onClick={() => void updateReview("rejected")}
                disabled={busy}
              >
                <X /> Reject
              </Button>
              <Button
                variant="outline"
                className="border-ink/15 bg-transparent text-ink"
                onClick={() => void updateReview("pending")}
                disabled={busy}
              >
                <Clock3 /> Keep pending
              </Button>
              <Button
                className="bg-moss text-cream hover:bg-moss/90"
                onClick={() => void updateReview("approved")}
                disabled={busy}
              >
                <Check /> Approve story
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-2xl p-5 ${tone}`}>
      <p className="text-xs uppercase tracking-[0.16em] text-ink/50">{label}</p>
      <p className="mt-3 font-display text-4xl font-semibold">{value}</p>
    </div>
  );
}
