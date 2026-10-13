import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// a4a-v1b2 — password field with a show/hide (eye) button.
type Props = Omit<React.ComponentProps<typeof Input>, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pr-12", className)}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-md text-ink/45 transition-colors hover:text-clay focus-visible:text-clay focus-visible:outline-none"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
});

/** Problems worth flagging before the form is sent (used on sign-up and reset). */
export function passwordProblem(password: string, confirm: string): string {
  if (password.length < 8) return "Use at least 8 characters for your password.";
  if (password !== password.trim())
    return "Your password starts or ends with a space. Remove it, or tap the eye icon to check what you typed.";
  if (password !== confirm)
    return "The two passwords don't match. Tap the eye icon to check what you typed.";
  return "";
}
