import type { ReactNode } from "react";
import { cn } from "../../../client/utils";

export function ComponentSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className="border-border bg-card shadow-default scroll-mt-24 rounded-sm border"
    >
      <div className="border-border border-b px-7 py-4">
        <h3 className="text-foreground font-medium">{title}</h3>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      <div className={cn("p-4 md:p-6 xl:p-9", className)}>{children}</div>
    </section>
  );
}
