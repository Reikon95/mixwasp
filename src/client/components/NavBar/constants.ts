import { routes } from "wasp/client/router";
import type { NavigationItem } from "./NavBar";

export const appNavigationItems: NavigationItem[] = [
  { name: "Charts", to: routes.MixesRoute.to },
  { name: "Favourites", to: routes.FavouriteMixesRoute.to },
  { name: "Submit", to: routes.SubmitMixRoute.to },
] as const;
