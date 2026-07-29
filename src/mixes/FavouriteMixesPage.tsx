import { useAuth } from "wasp/client/auth";
import {
  getMyFavouriteMixes,
  toggleMixFavourite,
  useQuery,
} from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

import { ArrowLeft, Heart } from "lucide-react";
import { useState } from "react";
import { Button } from "../client/components/ui/button";
import { MixWaspLoader } from "../client/components/MixWaspLoader";
import { toast } from "../client/hooks/use-toast";
import { MixFeed } from "./MixFeed";
import { MixRow } from "./MixRow";

export function FavouriteMixesPage() {
  const { data: user } = useAuth();
  const [togglingMixId, setTogglingMixId] = useState<number | null>(null);

  const {
    data: mixes,
    isLoading,
    error,
    refetch,
  } = useQuery(getMyFavouriteMixes);

  const handleToggleFavourite = async (mixId: number) => {
    setTogglingMixId(mixId);
    try {
      await toggleMixFavourite({ mixId });
      await refetch();
    } catch (err: unknown) {
      console.error(err);
      toast({
        title: "Favourite failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setTogglingMixId(null);
    }
  };

  const mixCount = mixes?.length ?? 0;

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <WaspRouterLink
          to={routes.MixesRoute.to}
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to charts
        </WaspRouterLink>

        <header className="mb-8">
          <div className="flex items-center gap-3">
            <Heart className="text-destructive size-8 fill-current" aria-hidden />
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Your favourites
            </h1>
          </div>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed">
            {isLoading
              ? "Loading your saved mixes…"
              : mixCount === 1
                ? "1 mix in your rotation."
                : `${mixCount} mixes in your rotation.`}
          </p>
        </header>

        {isLoading && <MixWaspLoader label="Loading favourites" />}

        {error && (
          <p className="text-destructive text-sm">
            Something went wrong loading your favourites.
          </p>
        )}

        {!isLoading && mixes && mixes.length === 0 && (
          <div className="border-border rounded-lg border border-dashed px-6 py-12 text-center">
            <Heart
              className="text-muted-foreground mx-auto size-10"
              aria-hidden
            />
            <p className="mt-4 font-medium">No favourites yet</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Heart mixes on the charts to build your personal collection.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <WaspRouterLink to={routes.MixesRoute.to}>
                Browse charts
              </WaspRouterLink>
            </Button>
          </div>
        )}

        {mixes && mixes.length > 0 && (
          <MixFeed>
            <ol>
              {mixes.map((mix) => (
                <MixRow
                  key={mix.id}
                  mix={mix}
                  favouriteCount={mix.favouriteCount}
                  isLoggedIn={!!user}
                  isToggling={togglingMixId === mix.id}
                  onToggle={() => handleToggleFavourite(mix.id)}
                />
              ))}
            </ol>
          </MixFeed>
        )}
      </div>
    </main>
  );
}
