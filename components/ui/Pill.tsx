import type { ButtonHTMLAttributes } from "react";

export const pillClassName =
  "inline-flex items-center justify-center gap-2 rounded-pill bg-primary px-6 py-3 font-mono text-sm text-page cursor-pointer transition-all duration-150 hover:opacity-90 active:scale-[0.97] disabled:cursor-default disabled:opacity-60 disabled:active:scale-100";

type PillProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Pill({ className, children, ...props }: PillProps) {
  return (
    <button className={[pillClassName, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </button>
  );
}
