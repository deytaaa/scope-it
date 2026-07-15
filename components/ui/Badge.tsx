import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-pill border-[0.5px] border-border bg-chrome px-2.5 py-1 font-mono text-xs leading-none text-secondary",
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
