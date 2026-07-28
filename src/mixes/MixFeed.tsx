import type { ReactNode } from "react";
import { cn } from "../client/utils";

export function MixFeed({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mix-feed border-border divide-border overflow-hidden rounded-sm border divide-y",
        className,
      )}
    >
      {children}
    </div>
  );
}
