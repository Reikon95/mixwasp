import { ReactNode } from "react";

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col justify-center px-4 pt-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="border-primary/30 bg-card/70 rounded-sm border px-4 py-8 shadow-[0_0_40px_hsl(var(--glow)/0.12)] backdrop-blur-md sm:px-10">
          <div className="-mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
