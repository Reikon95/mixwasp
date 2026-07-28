import logo from "../static/mixwaspnobg.png";
import { cn } from "../utils";

export function MixWaspLoader({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <img
        src={logo}
        alt=""
        aria-hidden
        className="size-16 animate-bounce drop-shadow-[0_0_18px_hsl(var(--glow)/0.55)] sm:size-20"
      />
      <p className="text-primary text-xs tracking-[0.3em] uppercase">
        {label}
        <span className="terminal-cursor" aria-hidden />
      </p>
      <span className="sr-only">{label}</span>
    </div>
  );
}
