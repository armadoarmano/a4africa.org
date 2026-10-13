import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password | a4africa.org" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The reset email link signs the user in temporarily (PASSWORD_RECOVERY).
    void supabase.auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setHasSession(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) {
      setMessage("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("The two passwords don't match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    await navigate({ to: "/submit" });
  };

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-4 py-10 font-body text-ink">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-clay">
          <ArrowLeft className="size-4" /> Back to a4africa.org
        </Link>
        <section className="mt-6 rounded-3xl bg-paper p-6 shadow-[0_24px_70px_-38px_var(--color-ink)] sm:p-9">
          <div className="flex items-center gap-3">
            <KeyRound className="size-5 text-clay" />
            <h1 className="font-display text-3xl font-semibold">Choose a new password</h1>
          </div>
          {hasSession === false ? (
            <div className="mt-4 text-sm leading-relaxed text-ink/65">
              <p>This reset link has expired or was already used.</p>
              <Button
                asChild
                className="mt-6 h-12 w-full rounded-full bg-moss text-cream hover:bg-moss/90"
              >
                <Link to="/auth">Request a new link</Link>
              </Button>
            </div>
          ) : (
            <form className="mt-6 grid gap-4" onSubmit={save}>
              <label className="grid gap-1.5 text-sm font-medium">
                New password
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={128}
                  required
                  autoComplete="new-password"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Confirm new password
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={8}
                  maxLength={128}
                  required
                  autoComplete="new-password"
                />
              </label>
              {message && (
                <p role="alert" className="rounded-xl bg-clay/10 p-3 text-sm text-clay">
                  {message}
                </p>
              )}
              <Button
                type="submit"
                className="mt-2 h-12 rounded-full bg-moss text-cream hover:bg-moss/90"
                disabled={busy || hasSession === null}
              >
                {busy ? "Saving…" : "Save new password"}
              </Button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
