import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageIntro, PageShell } from "@/components/site/PageShell";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | a4africa.org" },
      { name: "description", content: "Get in touch with the a4africa.org editorial team." },
      { property: "og:title", content: "Contact a4africa.org" },
      { property: "og:url", content: `${SITE_URL}/contact` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contact` }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const update =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Your message could not be sent.");
        return;
      }
      setSent(true);
    } catch {
      setError("Your message could not be sent. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <main>
        <PageIntro
          eyebrow="Contact"
          title={
            <>
              We'd love to <span className="italic text-clay">hear from you.</span>
            </>
          }
        >
          <p>
            Questions, partnerships, press, or a correction to a published story — send us a message
            and an editor will reply by email.
          </p>
        </PageIntro>
        <section className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-3xl bg-paper p-6 sm:p-9">
            {sent ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto size-10 text-moss" />
                <h2 className="mt-4 font-display text-3xl font-semibold">Message received.</h2>
                <p className="mt-2 text-sm text-ink/60">
                  Thank you, {form.name.split(" ")[0]}. We'll reply to {form.email} as soon as we
                  can.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-6 rounded-full border-ink/15 bg-transparent"
                >
                  <Link to="/">Back to stories</Link>
                </Button>
              </div>
            ) : (
              <form className="grid gap-5" onSubmit={submit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-semibold">
                    Your name
                    <Input
                      value={form.name}
                      onChange={update("name")}
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      className="bg-cream"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold">
                    Email address
                    <Input
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      required
                      maxLength={255}
                      autoComplete="email"
                      className="bg-cream"
                    />
                  </label>
                </div>
                <label className="grid gap-1.5 text-sm font-semibold">
                  <span>
                    Subject <span className="font-normal text-ink/45">(optional)</span>
                  </span>
                  <Input
                    value={form.subject}
                    onChange={update("subject")}
                    maxLength={150}
                    className="bg-cream"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold">
                  Message
                  <Textarea
                    value={form.message}
                    onChange={update("message")}
                    required
                    minLength={10}
                    maxLength={5000}
                    className="min-h-40 bg-cream"
                  />
                </label>
                <label className="hidden" aria-hidden="true">
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={update("website")}
                  />
                </label>
                {error && (
                  <p role="alert" className="rounded-xl bg-clay/10 p-3 text-sm text-clay">
                    {error}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-ink/50">
                    We use your details only to reply. See our{" "}
                    <Link to="/privacy" className="underline">
                      privacy policy
                    </Link>
                    .
                  </p>
                  <Button
                    type="submit"
                    className="gap-2 rounded-full bg-moss px-6 text-cream hover:bg-moss/90"
                    disabled={busy}
                  >
                    {busy ? "Sending…" : "Send message"} <Send className="size-4" />
                  </Button>
                </div>
              </form>
            )}
          </div>
          <aside className="grid content-start gap-6">
            <div className="rounded-2xl bg-moss p-6 text-cream">
              <Mail className="size-6 text-gold" />
              <h2 className="mt-3 font-display text-2xl font-semibold">Prefer email?</h2>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-2 block break-all text-cream/85 underline-offset-4 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
            <div className="rounded-2xl border border-ink/10 p-6">
              <h2 className="font-display text-xl font-semibold">Have a story to share?</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                Stories go through the submission desk, not this form, so an editor can review them
                with the photo.
              </p>
              <Button asChild className="mt-4 rounded-full bg-clay text-cream hover:bg-clay/90">
                <Link to="/submit">Submit a story</Link>
              </Button>
            </div>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}
