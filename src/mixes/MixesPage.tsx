import { useAuth } from "wasp/client/auth";
import {
  getPopularMixes,
  toggleMixFavourite,
  useQuery,
} from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../client/components/ui/button";
import { MixWaspLoader } from "../client/components/MixWaspLoader";
import { useDebounce } from "../client/hooks/useDebounce";
import { toast } from "../client/hooks/use-toast";
import { cn } from "../client/utils";
import { ChartsFilters, type ChartFiltersState } from "./ChartsFilters";
import { MixFeed } from "./MixFeed";
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
  const [togglingMixId, setTogglingMixId] = useState<number | null>(null);
  const [filters, setFilters] = useState<ChartFiltersState>({ q: "" });
  const debouncedSearch = useDebounce(filters.q.trim(), 300);

  const {
    data: mixes,
    isLoading,
    error,
    refetch,
  } = useQuery(getPopularMixes, {
    period,
    q: debouncedSearch || undefined,
    genreId: filters.genreId,
    tagId: filters.tagId,
  });

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

  const hasActiveFilters =
    debouncedSearch.length > 0 ||
    filters.genreId !== undefined ||
    filters.tagId !== undefined;

  const showEmpty =
    !isLoading && mixes !== undefined && mixes.length === 0;

  return (
    <main className="mixes-page px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Charts
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Top mixes by favourites - heart the ones you keep coming back to.
            </p>
          </div>
          {user ? (
            <Button asChild size="sm" className="shrink-0 self-start sm:self-auto">
              <WaspRouterLink to={routes.SubmitMixRoute.to}>
                <Plus className="size-4" aria-hidden />
                Submit mix
              </WaspRouterLink>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="shrink-0 self-start sm:self-auto"
            >
              <WaspRouterLink to={routes.LoginRoute.to}>
                Log in to submit
              </WaspRouterLink>
            </Button>
          )}
        </header>

        <div
          className="border-border mb-4 flex gap-1 overflow-x-auto overflow-y-hidden border-b sm:gap-4"
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
                "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                period === item.value
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <ChartsFilters filters={filters} onChange={setFilters} />

        {isLoading && <MixWaspLoader label="Loading mixes" />}

        {error && (
          <p className="text-destructive text-sm">
            Something went wrong loading mixes.
          </p>
        )}

        {showEmpty && (
          <div className="border-border rounded-md border border-dashed px-6 py-12 text-center">
            <p className="font-medium">
              {hasActiveFilters
                ? "No mixes match these filters"
                : "No mixes in this period yet"}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              {hasActiveFilters
                ? "Try clearing filters, switching period, or searching something else."
                : "Switch to All time, or submit a mix to get the charts started."}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ q: "" })}
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPeriod("all")}
                >
                  View all time
                </Button>
              )}
              {user && !hasActiveFilters && (
                <Button asChild size="sm">
                  <WaspRouterLink to={routes.SubmitMixRoute.to}>
                    Submit mix
                  </WaspRouterLink>
                </Button>
              )}
            </div>
          </div>
        )}

        {mixes && mixes.length > 0 && (
          <MixFeed>
            <ol className="mixes-page__list">
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
          </MixFeed>
        )}

        {!user && (
          <p className="text-muted-foreground mt-6 text-center text-sm">
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
