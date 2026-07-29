import {
  Disc3,
  Headphones,
  Heart,
  Mic2,
  Plus,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import { routes } from "wasp/client/router";

export const userMenuItems = [
  {
    name: "Charts",
    to: routes.MixesRoute.to,
    icon: Headphones,
    isAdminOnly: false,
    isAuthRequired: false,
  },
  {
    name: "Browse",
    to: routes.BrowseMixesRoute.to,
    icon: Search,
    isAdminOnly: false,
    isAuthRequired: false,
  },
  {
    name: "Artists",
    to: routes.ArtistsRoute.to,
    icon: Mic2,
    isAdminOnly: false,
    isAuthRequired: false,
  },
  {
    name: "Genres",
    to: routes.GenresRoute.to,
    icon: Disc3,
    isAdminOnly: false,
    isAuthRequired: false,
  },
  {
    name: "Submit a mix",
    to: routes.SubmitMixRoute.to,
    icon: Plus,
    isAdminOnly: false,
    isAuthRequired: true,
  },
  {
    name: "Your favourites",
    to: routes.FavouriteMixesRoute.to,
    icon: Heart,
    isAdminOnly: false,
    isAuthRequired: true,
  },
  {
    name: "Account Settings",
    to: routes.AccountRoute.to,
    icon: Settings,
    isAuthRequired: false,
    isAdminOnly: false,
  },
  {
    name: "Admin Dashboard",
    to: routes.AdminRoute.to,
    icon: Shield,
    isAuthRequired: false,
    isAdminOnly: true,
  },
] as const;
