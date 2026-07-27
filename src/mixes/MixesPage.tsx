import { useAuth } from "wasp/client/auth";
import {
  ensureDemoMixes,
  getPopularMixes,
  toggleMixFavourite,
  useQuery,
} from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

import { Plus } from "lucide-react";
import { useEffect, useState, useEffectEvent } from "react";
import { Button } from "../client/components/ui/button";
import { MixWaspLoader } from "../client/components/MixWaspLoader";
import { toast } from "../client/hooks/use-toast";
import { cn } from "../client/utils";
import { MixRow } from "./MixRow";
import type { PopularityPeriod } from "./schemas";

const PERIODS: { value: PopularityPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

export function MixesPage() {
  const { data: user } = useAuth();
  const [period, setPeriod] = useState<PopularityPeriod>("week");
  const [isSeeding, setIsSeeding] = useState(false);
  const [togglingMixId, setTogglingMixId] = useState<number | null>(null);

  const {
    data: mixes,
    isLoading,
    error,
    refetch,
  } = useQuery(getPopularMixes, { period });

  const seedIfEmpty = useEffectEvent(async () => {
    setIsSeeding(true);
    try {
      const result = await ensureDemoMixes();
      if (result.seeded) {
        toast({
          title: "Demo mixes loaded",
          description: "Sample sets are ready - favourite a few to try it out.",
        });
        await refetch();
      }
    } catch (err: unknown) {
      console.error(err);
      toast({
        title: "Could not load demo mixes",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  });

  useEffect(() => {
    void seedIfEmpty();
  }, []);

  const handleToggleFavourite = async (mixId: number) => {
    if (!user) {
      toast({
        title: "Log in to favourite",
        description: "Create an account or sign in to save mixes you love.",
      });
      return;
    }

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

  const showEmptyPeriod =
    !isLoading && !isSeeding && mixes !== undefined && mixes.length === 0;

  return (
    <main className="mixes-page px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mixes-page__intro mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              What&apos;s getting played
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl text-base leading-relaxed">
              Browse the community&apos;s favorite sets. Filter by when people
              favourited them, then heart the ones you keep coming back to.
            </p>
          </div>
          {user ? (
            <Button asChild className="shrink-0 self-start sm:self-auto">
              <WaspRouterLink to={routes.SubmitMixRoute.to}>
                <Plus className="size-4" aria-hidden />
                Submit mix
              </WaspRouterLink>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="shrink-0 self-start sm:self-auto"
            >
              <WaspRouterLink to={routes.LoginRoute.to}>
                Log in to submit
              </WaspRouterLink>
            </Button>
          )}
        </header>

        <div
          className="mixes-page__periods mb-8 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Popularity period"
        >
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={period === item.value}
              onClick={() => setPeriod(item.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                period === item.value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {(isLoading || isSeeding) && (
          <MixWaspLoader
            label={isSeeding ? "Loading demo mixes" : "Loading mixes"}
          />
        )}

        {error && (
          <p className="text-destructive text-sm">
            Something went wrong loading mixes.
          </p>
        )}

        {showEmptyPeriod && (
          <div className="border-border rounded-lg border border-dashed px-6 py-12 text-center">
            <p className="font-medium">No favourites in this period yet</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Switch to All time, or log in and heart a mix to get this
              leaderboard moving.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => setPeriod("all")}
            >
              View all time
            </Button>
          </div>
        )}

        {mixes && mixes.length > 0 && (
          <ol className="mixes-page__list space-y-3">
            {mixes.map((mix, index) => (
              <MixRow
                key={mix.id}
                mix={mix}
                rank={index + 1}
                favouriteCount={mix.periodFavouriteCount}
                isLoggedIn={!!user}
                isToggling={togglingMixId === mix.id}
                onToggle={() => handleToggleFavourite(mix.id)}
              />
            ))}
          </ol>
        )}

        {!user && (
          <p className="text-muted-foreground mt-8 text-center text-sm">
            <WaspRouterLink
              to={routes.LoginRoute.to}
              className="text-foreground underline-offset-4 hover:underline"
            >
              Log in
            </WaspRouterLink>{" "}
            to favourite mixes.
          </p>
        )}
      </div>
    </main>
  );
}
