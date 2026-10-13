import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, FileText, LayoutDashboard, LogOut, Send } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

// a4a-v1b4 — shows who is signed in (name + photo/initials) with an account menu.

function metaString(user: User, keys: string[]) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function accountName(user: User) {
  return (
    metaString(user, ["display_name", "full_name", "name"]) ||
    (user.email ? user.email.split("@")[0] : "") ||
    "My account"
  );
}

export function AccountAvatar({ user, size = "md" }: { user: User; size?: "md" | "lg" }) {
  const [broken, setBroken] = useState(false);
  const photo = metaString(user, ["avatar_url", "picture"]);
  const name = accountName(user);
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "A";
  const box = size === "lg" ? "size-11 text-sm" : "size-8 text-xs";
  if (photo && !broken) {
    return (
      <img
        src={photo}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`${box} shrink-0 rounded-full object-cover ring-2 ring-gold/60`}
      />
    );
  }
  return (
    <span
      className={`${box} grid shrink-0 place-items-center rounded-full bg-clay font-semibold text-cream ring-2 ring-gold/60`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function AccountMenu({ user, isAdmin }: { user: User; isAdmin: boolean }) {
  const navigate = useNavigate();
  const name = accountName(user);
  const firstName = name.split(/\s+/)[0] ?? name;

  const signOut = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex max-w-[11rem] items-center gap-2 rounded-full border border-ink/12 bg-paper/70 py-1 pl-1 pr-2.5 text-sm text-ink transition-colors hover:border-clay/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 sm:max-w-[15rem]"
          aria-label={`Signed in as ${name}. Open account menu`}
        >
          <AccountAvatar user={user} />
          <span className="truncate font-medium">{firstName}</span>
          <ChevronDown className="size-4 shrink-0 text-ink/45" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 rounded-2xl border-ink/10 bg-cream p-2 font-body text-ink shadow-xl"
      >
        <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
          <AccountAvatar user={user} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{name}</p>
            {user.email && <p className="truncate text-xs text-ink/55">{user.email}</p>}
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-clay">
              {isAdmin ? "Administrator" : "Contributor"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-ink/10" />
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2 py-2.5">
          <Link to="/submit">
            <FileText className="size-4 text-ink/55" /> My submissions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2 py-2.5">
          <Link to="/submit">
            <Send className="size-4 text-ink/55" /> Submit a story
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2 py-2.5 text-moss">
            <Link to="/admin">
              <LayoutDashboard className="size-4" /> Admin desk
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-ink/10" />
        <DropdownMenuItem
          className="cursor-pointer rounded-lg px-2 py-2.5 text-clay focus:text-clay"
          onSelect={() => void signOut()}
        >
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
