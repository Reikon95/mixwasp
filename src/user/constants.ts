import { Headphones, Heart, Plus, Settings, Shield } from "lucide-react";
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
