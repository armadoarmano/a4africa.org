import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { AfricaMark } from "@/components/site/AfricaMark";
import { PasswordInput, passwordProblem } from "@/components/site/PasswordInput";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search["next"] === "string" ? { next: search["next"] } : {},
  head: () => ({
    meta: [
      { title: "Sign in | a4africa.org" },
      {
        name: "description",
        content:
          "Sign in to share good news and stories from Africa with the a4africa.org editorial desk.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function safeNext(next: string | undefined) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/submit";
}

type Mode = "sign-in" | "sign-up" | "forgot";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.97 10.97 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const next = safeNext(search.next);
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in (or just returned from Google / an email link): continue.
  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) void navigate({ to: next });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session && mounted) void navigate({ to: next });
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [navigate, next]);

  const switchMode = (target: Mode) => {
    setMode(target);
    setConfirm("");
    setMessage("");
    setInfo("");
  };

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setInfo("");

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      setInfo(
        "If an account exists for that email, a password reset link is on its way. Check your inbox and spam folder.",
      );
      return;
    }

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) {
        setMessage(
          error.message === "Invalid login credentials"
            ? "That email and password don't match. Try again or reset your password."
            : error.message,
        );
        return;
      }
      await navigate({ to: next });
      return;
    }

    const problem = passwordProblem(password, confirm);
    if (problem) {
      setBusy(false);
      setMessage(problem);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.session) {
      await navigate({ to: next });
      return;
    }
    setInfo("Check your email to confirm your account. The link brings you straight back here.");
  };

  const handleGoogle = async () => {
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
    }
  };

  const heading =
    mode === "sign-in"
      ? "Welcome back"
      : mode === "sign-up"
        ? "Create your account"
        : "Reset your password";
  const sub =
    mode === "sign-in"
      ? "Continue sharing the good side of Africa."
      : mode === "sign-up"
        ? "A name and email help us credit your stories."
        : "Enter your email and we'll send you a reset link.";

  return (
    <main className="min-h-screen bg-cream px-4 py-8 font-body text-ink sm:px-8">
      <div className="mx-auto max-w-[1180px]">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-ink/60 transition-colors hover:text-clay"
        >
          <ArrowLeft className="size-4" /> Back to a4africa.org
        </Link>
        <div className="grid items-center gap-10 py-10 lg:min-h-[calc(100vh-120px)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <section className="max-w-xl">
            <AfricaMark className="h-24 w-auto" title="" />
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-clay">
              The editorial desk
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.02] sm:text-7xl">
              Give the good a <span className="italic text-clay">place</span> to live.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink/65">
              Sign in to submit a good deed, a beautiful place, or a person making Africa shine.
              Every story is reviewed before publication.
            </p>
            <div className="mt-8 flex items-center gap-3 text-sm text-ink/60">
              <ShieldCheck className="size-5 shrink-0 text-moss" /> Your story stays in the review
              queue until an editor approves it.
            </div>
          </section>
          <section className="rounded-3xl bg-paper p-6 shadow-[0_24px_70px_-38px_var(--color-ink)] sm:p-9">
            <div className="flex items-center gap-3">
              {mode === "forgot" ? (
                <KeyRound className="size-5 text-clay" />
              ) : (
                <Mail className="size-5 text-clay" />
              )}
              <h2 className="font-display text-3xl font-semibold">{heading}</h2>
            </div>
            <p className="mt-2 text-sm text-ink/60">{sub}</p>
            {mode !== "forgot" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-7 h-12 w-full gap-3 rounded-full border-ink/15 bg-transparent text-ink hover:bg-cream"
                  onClick={() => void handleGoogle()}
                  disabled={busy}
                >
                  <GoogleIcon /> Continue with Google
                </Button>
                <div className="my-6 flex items-center gap-3 text-xs text-ink/35">
                  <span className="h-px flex-1 bg-ink/10" /> or use email{" "}
                  <span className="h-px flex-1 bg-ink/10" />
                </div>
              </>
            )}
            <form
              className={mode === "forgot" ? "mt-7 grid gap-4" : "grid gap-4"}
              onSubmit={handleEmailAuth}
            >
              {mode === "sign-up" && (
                <label className="grid gap-1.5 text-sm font-medium">
                  Your name
                  <Input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    maxLength={80}
                    required
                    placeholder="How should we credit you?"
                    autoComplete="name"
                  />
                </label>
              )}
              <label className="grid gap-1.5 text-sm font-medium">
                Email address
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={255}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
              {mode !== "forgot" && (
                <label className="grid gap-1.5 text-sm font-medium">
                  <span className="flex items-center justify-between">
                    Password
                    {mode === "sign-in" && (
                      <button
                        type="button"
                        className="text-xs font-medium text-clay underline-offset-4 hover:underline"
                        onClick={() => switchMode("forgot")}
                      >
                        Forgot password?
                      </button>
                    )}
                  </span>
                  <PasswordInput
                    id="auth-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    maxLength={128}
                    required
                    placeholder="At least 8 characters"
                    autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  />
                </label>
              )}
              {mode === "sign-up" && (
                <label className="grid gap-1.5 text-sm font-medium">
                  Confirm password
                  <PasswordInput
                    id="auth-password-confirm"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    minLength={8}
                    maxLength={128}
                    required
                    placeholder="Type the same password again"
                    autoComplete="new-password"
                    aria-invalid={confirm.length > 0 && confirm !== password}
                  />
                  {confirm.length > 0 && (
                    <span
                      className={
                        confirm === password
                          ? "text-xs font-normal text-moss"
                          : "text-xs font-normal text-clay"
                      }
                    >
                      {confirm === password ? "✓ Passwords match" : "Passwords don't match yet"}
                    </span>
                  )}
                </label>
              )}
              {message && (
                <p role="alert" className="rounded-xl bg-clay/10 p-3 text-sm text-clay">
                  {message}
                </p>
              )}
              {info && (
                <p role="status" className="rounded-xl bg-moss/10 p-3 text-sm text-moss">
                  {info}
                </p>
              )}
              <Button
                type="submit"
                className="mt-2 h-12 rounded-full bg-moss text-cream hover:bg-moss/90"
                disabled={busy}
              >
                {busy
                  ? "Please wait…"
                  : mode === "sign-in"
                    ? "Sign in"
                    : mode === "sign-up"
                      ? "Create account"
                      : "Send reset link"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-ink/60">
              {mode === "sign-in" && (
                <>
                  New here?{" "}
                  <button
                    type="button"
                    className="font-semibold text-clay underline-offset-4 hover:underline"
                    onClick={() => switchMode("sign-up")}
                  >
                    Create an account
                  </button>
                </>
              )}
              {mode === "sign-up" && (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="font-semibold text-clay underline-offset-4 hover:underline"
                    onClick={() => switchMode("sign-in")}
                  >
                    Sign in
                  </button>
                </>
              )}
              {mode === "forgot" && (
                <button
                  type="button"
                  className="font-semibold text-clay underline-offset-4 hover:underline"
                  onClick={() => switchMode("sign-in")}
                >
                  Back to sign in
                </button>
              )}
            </p>
            {mode === "sign-up" && (
              <p className="mt-4 text-center text-xs leading-relaxed text-ink/45">
                By creating an account you agree to our{" "}
                <Link to="/guidelines" className="underline">
                  guidelines
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline">
                  privacy policy
                </Link>
                .
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
