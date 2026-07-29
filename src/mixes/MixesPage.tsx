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
  { value: "new", label: "New" },
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
    limit: 50,
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
        <header className="mixes-page__intro mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-primary/70 mb-1 text-[11px] tracking-[0.25em] uppercase">
              // mixwasp
            </p>
            <h1 className="text-phosphor terminal-cursor text-2xl font-bold tracking-[0.12em] sm:text-3xl">
              Charts
            </h1>
          </div>
          {user ? (
            <Button
              asChild
              size="lg"
              className="shrink-0 self-stretch shadow-[0_0_28px_hsl(var(--glow)/0.55)] sm:self-auto"
            >
              <WaspRouterLink to={routes.SubmitMixRoute.to}>
                <Plus className="size-5" aria-hidden />
                Submit mix
              </WaspRouterLink>
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              className="shrink-0 self-stretch shadow-[0_0_28px_hsl(var(--glow)/0.55)] sm:self-auto"
            >
              <WaspRouterLink to={routes.LoginRoute.to}>
                <Plus className="size-5" aria-hidden />
                Log in to submit
              </WaspRouterLink>
            </Button>
          )}
        </header>

        <div
          className="mixes-page__periods border-border mb-4 flex gap-1 overflow-x-auto overflow-y-hidden border-b sm:gap-2"
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
                "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium tracking-wider whitespace-nowrap uppercase transition-colors",
                period === item.value
                  ? "border-primary text-primary shadow-[0_0_16px_hsl(var(--glow)/0.25)]"
                  : "text-muted-foreground hover:text-primary border-transparent",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mixes-page__filters">
          <ChartsFilters filters={filters} onChange={setFilters} />
        </div>

        {isLoading && <MixWaspLoader label="Loading mixes" />}

        {error && (
          <p className="text-destructive text-sm tracking-wide">
            [ERR] Something went wrong loading mixes.
          </p>
        )}

        {showEmpty && (
          <div className="border-primary/30 bg-card/40 rounded-sm border border-dashed px-6 py-12 text-center">
            <p className="font-display text-primary text-sm tracking-[0.15em]">
              {hasActiveFilters
                ? "No mixes match these filters"
                : period === "new"
                  ? "No mixes yet"
                  : "No mixes in this period yet"}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              {hasActiveFilters
                ? "Try clearing filters, switching period, or searching something else."
                : period === "new"
                  ? "Submit a mix to kick off the feed."
                  : "Switch to New or All time, or submit a mix to get the charts started."}
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
              ) : period !== "new" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPeriod("new")}
                >
                  View new
                </Button>
              ) : null}
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
          <p className="text-muted-foreground mt-6 text-center text-sm tracking-wide">
            <WaspRouterLink
              to={routes.LoginRoute.to}
              className="text-primary underline-offset-4 hover:underline"
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
