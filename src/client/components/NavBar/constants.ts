import { routes } from "wasp/client/router";
import type { NavigationItem } from "./NavBar";

export const appNavigationItems: NavigationItem[] = [
  { name: "Charts", to: routes.MixesRoute.to },
  { name: "Browse", to: routes.BrowseMixesRoute.to },
  { name: "Artists", to: routes.ArtistsRoute.to },
  { name: "Genres", to: routes.GenresRoute.to },
  { name: "Favourites", to: routes.FavouriteMixesRoute.to },
  { name: "Submit", to: routes.SubmitMixRoute.to },
] as const;
