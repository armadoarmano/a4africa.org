import { Link } from "@tanstack/react-router";

import { AfricaMark } from "./AfricaMark";

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const mark = size === "sm" ? "h-12 w-auto" : "h-14 w-auto sm:h-16";
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="a4africa.org home">
      <AfricaMark className={mark} title="" />
      <span className="font-display text-xl leading-none tracking-tight">
        a4africa<span className="text-clay">.org</span>
      </span>
    </Link>
  );
}
