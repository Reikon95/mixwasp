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
        "border-border divide-border overflow-hidden rounded-md border divide-y",
        className,
      )}
    >
      {children}
    </div>
  );
}
