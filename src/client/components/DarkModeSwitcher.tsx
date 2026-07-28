import { Moon, Sun } from "lucide-react";
import { Label } from "../../client/components/ui/label";
import { useColorMode } from "../hooks/useColorMode";
import { cn } from "../utils";

export function DarkModeSwitcher() {
  const [colorMode, setColorMode] = useColorMode();
  const isInLightMode = colorMode === "light";

  return (
    <div>
      <Label
        className={cn(
          "bg-muted border-primary/20 h-7.5 relative m-0 block w-14 cursor-pointer rounded-sm border transition-colors duration-300 ease-in-out",
        )}
      >
        <input
          type="checkbox"
          aria-label="Toggle dark mode"
          checked={!isInLightMode}
          onChange={() => {
            if (typeof setColorMode === "function") {
              setColorMode(isInLightMode ? "dark" : "light");
            }
          }}
          className="absolute top-0 z-50 m-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className={cn(
            "border-primary/30 absolute left-[3px] top-1/2 flex h-6 w-6 -translate-y-1/2 translate-x-0 items-center justify-center rounded-sm border bg-card shadow-md transition-all duration-300 ease-in-out",
            {
              "right-[3px]! translate-x-full!": !isInLightMode,
            },
          )}
        >
          <ModeIcon isInLightMode={isInLightMode} />
        </span>
      </Label>
    </div>
  );
}

function ModeIcon({ isInLightMode }: { isInLightMode: boolean }) {
  const iconStyle =
    "absolute inset-0 flex items-center justify-center transition-opacity ease-in-out duration-300";
  return (
    <>
      <span
        className={cn(iconStyle, isInLightMode ? "opacity-100" : "opacity-0")}
      >
        <Sun className="text-warning size-4" />
      </span>
      <span
        className={cn(iconStyle, !isInLightMode ? "opacity-100" : "opacity-0")}
      >
        <Moon className="text-primary size-4" />
      </span>
    </>
  );
}
