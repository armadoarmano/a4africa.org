import { useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

// a4a-v1b3 — "Sign in with Google" that runs on a4africa.org itself (Google Identity Services).
// Google's consent screen then names a4africa.org instead of the Supabase project address.
// The Client ID is public by design; it can be overridden with VITE_GOOGLE_CLIENT_ID.
const GOOGLE_CLIENT_ID =
  (import.meta.env["VITE_GOOGLE_CLIENT_ID"] as string | undefined) ||
  "991743136050-4j06iefs4c6mlthckopd0r0fmf0dc1l7.apps.googleusercontent.com";

type CredentialResponse = { credential?: string };
type GoogleId = {
  initialize: (options: Record<string, unknown>) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadGoogleScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Google sign-in could not load"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

async function makeNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...bytes));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

export function GoogleSignInButton({
  text = "continue_with",
  onError,
  onFallback,
}: {
  text?: "continue_with" | "signin_with" | "signup_with";
  onError: (message: string) => void;
  /** Called when Google's button can't load, so the page can offer the redirect sign-in instead. */
  onFallback: () => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "busy">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleScript();
        const { raw, hashed } = await makeNonce();
        const api = window.google?.accounts?.id;
        if (cancelled || !api || !holder.current) return;
        api.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: hashed,
          ux_mode: "popup",
          itp_support: true,
          use_fedcm_for_button: true,
          context: text === "signup_with" ? "signup" : "signin",
          callback: async (response: CredentialResponse) => {
            if (!response.credential) {
              onError("Google sign-in was cancelled. Please try again.");
              return;
            }
            setState("busy");
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce: raw,
            });
            if (error) {
              setState("ready");
              onError(error.message);
            }
            // On success the auth page's sign-in listener takes the person onward.
          },
        });
        const width = Math.min(400, Math.max(220, holder.current.offsetWidth || 320));
        holder.current.innerHTML = "";
        api.renderButton(holder.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text,
          logo_alignment: "center",
          width,
        });
        setState("ready");
      } catch {
        if (!cancelled) onFallback();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="mt-7">
      <div
        ref={holder}
        className="flex min-h-11 w-full justify-center [&_iframe]:!mx-auto"
        aria-busy={state !== "ready"}
      />
      {state === "loading" && (
        <p className="mt-2 text-center text-xs text-ink/45">Loading Google sign-in…</p>
      )}
      {state === "busy" && <p className="mt-2 text-center text-xs text-ink/55">Signing you in…</p>}
    </div>
  );
}
