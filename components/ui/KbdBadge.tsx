import type { HTMLAttributes } from "react";

type KbdBadgeProps = HTMLAttributes<HTMLSpanElement>;

export function KbdBadge({ className, children, ...props }: KbdBadgeProps) {
  return (
    <span
      className={[
        "inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-md border-[0.5px] border-border px-1.5 font-mono text-xs leading-none text-muted transition-colors duration-150",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
