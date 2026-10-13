import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { AccountAvatar, AccountMenu, accountName } from "./AccountMenu";
import { Logo } from "./Logo";

const navLinks = [
  { to: "/", hash: "stories", label: "Stories" },
  { to: "/about", label: "About" },
  { to: "/guidelines", label: "Guidelines" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();
  const { user, isAdmin } = useSession();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    await navigate({ to: "/" });
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-ink/10 py-5 sm:py-6">
      <Logo />
      <nav
        className="hidden items-center gap-7 text-[13px] font-medium text-ink/70 lg:flex"
        aria-label="Main navigation"
      >
        {navLinks.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            {...("hash" in link ? { hash: link.hash } : {})}
            className="transition-colors hover:text-clay"
            activeProps={{ className: "text-clay" }}
            activeOptions={{ exact: true, includeHash: false }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        {user ? (
          <>
            {isAdmin && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden gap-2 text-ink/70 xl:inline-flex"
              >
                <Link to="/admin">
                  <LayoutDashboard className="size-4" /> Admin desk
                </Link>
              </Button>
            )}
            <AccountMenu user={user} isAdmin={isAdmin} />
          </>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm" className="hidden text-ink/70 md:inline-flex">
              <Link to="/auth" search={{ next: "/submit" }}>
                Sign in
              </Link>
            </Button>
            <Button
              asChild
              className="hidden gap-2 rounded-full bg-moss px-4 text-cream hover:bg-moss/90 sm:inline-flex"
            >
              <Link to="/submit">
                Submit a story <Send className="size-4" />
              </Link>
            </Button>
          </>
        )}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-ink lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[86vw] max-w-sm border-ink/10 bg-cream p-0 font-body text-ink [&>button]:hidden"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <SheetTitle className="font-display text-xl font-normal">a4africa.org</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close menu">
                  <X className="size-5" />
                </Button>
              </SheetClose>
            </div>
            {user && (
              <div className="flex items-center gap-3 border-b border-ink/10 bg-paper/60 px-6 py-4">
                <AccountAvatar user={user} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{accountName(user)}</p>
                  {user.email && <p className="truncate text-xs text-ink/55">{user.email}</p>}
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-clay">
                    {isAdmin ? "Administrator" : "Contributor"}
                  </p>
                </div>
              </div>
            )}
            <nav className="grid px-3 py-4" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <SheetClose asChild key={link.label}>
                  <Link
                    to={link.to}
                    {...("hash" in link ? { hash: link.hash } : {})}
                    className="rounded-xl px-3 py-3.5 font-display text-2xl transition-colors hover:bg-paper hover:text-clay"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
              {user && (
                <SheetClose asChild>
                  <Link
                    to="/submit"
                    className="rounded-xl px-3 py-3.5 font-display text-2xl transition-colors hover:bg-paper hover:text-clay"
                  >
                    My submissions
                  </Link>
                </SheetClose>
              )}
              {isAdmin && (
                <SheetClose asChild>
                  <Link
                    to="/admin"
                    className="rounded-xl px-3 py-3.5 font-display text-2xl text-moss transition-colors hover:bg-paper"
                  >
                    Admin desk
                  </Link>
                </SheetClose>
              )}
            </nav>
            <div className="grid gap-3 border-t border-ink/10 px-6 py-6">
              <SheetClose asChild>
                <Button
                  asChild
                  className="h-12 gap-2 rounded-full bg-moss text-cream hover:bg-moss/90"
                >
                  <Link to="/submit">
                    Submit a story <Send className="size-4" />
                  </Link>
                </Button>
              </SheetClose>
              {user ? (
                <Button
                  variant="outline"
                  className="h-12 gap-2 rounded-full border-ink/15 bg-transparent"
                  onClick={() => void signOut()}
                >
                  <LogOut className="size-4" /> Sign out
                </Button>
              ) : (
                <SheetClose asChild>
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-full border-ink/15 bg-transparent"
                  >
                    <Link to="/auth" search={{ next: "/submit" }}>
                      Sign in
                    </Link>
                  </Button>
                </SheetClose>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
