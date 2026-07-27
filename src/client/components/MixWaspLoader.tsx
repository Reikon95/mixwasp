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
        "flex flex-col items-center justify-center py-16",
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
        className="size-16 animate-bounce sm:size-20"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
