import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export function useColorMode() {
  const [colorMode, setColorMode] = useLocalStorage("color-theme", "dark");

  useEffect(() => {
    const className = "dark";
    const roots = [window.document.documentElement, window.document.body];

    for (const el of roots) {
      if (colorMode === "dark") {
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    }
  }, [colorMode]);

  return [colorMode, setColorMode];
}
