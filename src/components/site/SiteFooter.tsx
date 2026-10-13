import { Link } from "@tanstack/react-router";
import { AfricaMark } from "./AfricaMark";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-6 border-t border-ink/10 py-12 text-sm">
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <AfricaMark className="h-16 w-auto" title="" />
            <span className="font-display text-xl tracking-tight">
              a4africa<span className="text-clay">.org</span>
            </span>
          </div>
          <p className="mt-4 leading-relaxed text-ink/60">
            The good side of Africa, told by its people. Every story is reviewed by a human editor
            before it is published.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">
            Read & share
          </p>
          <ul className="mt-4 grid gap-2.5 text-ink/65">
            <li>
              <Link to="/" hash="stories" className="hover:text-clay">
                Latest stories
              </Link>
            </li>
            <li>
              <Link to="/submit" className="hover:text-clay">
                Submit a story
              </Link>
            </li>
            <li>
              <Link to="/guidelines" className="hover:text-clay">
                Submission guidelines
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">About</p>
          <ul className="mt-4 grid gap-2.5 text-ink/65">
            <li>
              <Link to="/about" className="hover:text-clay">
                Our mission
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-clay">
                Contact us
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-clay">
                Privacy policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-6 text-xs text-ink/45">
        <span>© {year} a4africa.org. All rights reserved.</span>
        <span>No nation ranked above another.</span>
      </div>
    </footer>
  );
}
