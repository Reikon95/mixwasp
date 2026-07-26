import { useAuth } from "wasp/client/auth";
import {
  ensureDemoMixes,
  getPopularMixes,
  toggleMixUpvote,
  useQuery,
} from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

import { ArrowUpRight, ChevronUp, Headphones } from "lucide-react";
import { useEffect, useState, useEffectEvent } from "react";
import { Button } from "../client/components/ui/button";
import { toast } from "../client/hooks/use-toast";
import { cn } from "../client/utils";
import type { PopularityPeriod, PopularMix } from "./operations";

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
          description: "Sample sets are ready — upvote a few to try it out.",
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

  const handleToggleUpvote = async (mixId: number) => {
    if (!user) {
      toast({
        title: "Log in to upvote",
        description: "Create an account or sign in to cast your vote.",
      });
      return;
    }

    setTogglingMixId(mixId);
    try {
      await toggleMixUpvote({ mixId });
      await refetch();
    } catch (err: unknown) {
      console.error(err);
      toast({
        title: "Upvote failed",
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
      <div className="mx-auto max-w-3xl">
        <header className="mixes-page__intro mb-10">
          <p className="text-muted-foreground mb-3 flex items-center gap-2 text-sm tracking-wide uppercase">
            <Headphones className="size-4" aria-hidden />
            Your Top Mixes
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            What&apos;s getting played
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-base leading-relaxed">
            Browse the community&apos;s favorite sets. Filter by when the votes
            landed, then upvote the ones you keep coming back to.
          </p>
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
          <p className="text-muted-foreground text-sm">
            {isSeeding ? "Loading demo mixes…" : "Loading mixes…"}
          </p>
        )}

        {error && (
          <p className="text-destructive text-sm">
            Something went wrong loading mixes.
          </p>
        )}

        {showEmptyPeriod && (
          <div className="border-border rounded-lg border border-dashed px-6 py-12 text-center">
            <p className="font-medium">No upvotes in this period yet</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Switch to All time, or log in and upvote a mix to get this
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
                isLoggedIn={!!user}
                isToggling={togglingMixId === mix.id}
                onToggle={() => handleToggleUpvote(mix.id)}
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
            to upvote mixes.
          </p>
        )}
      </div>
    </main>
  );
}

function MixRow({
  mix,
  rank,
  isLoggedIn,
  isToggling,
  onToggle,
}: {
  mix: PopularMix;
  rank: number;
  isLoggedIn: boolean;
  isToggling: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="mixes-page__row border-border bg-card/40 group flex items-stretch gap-3 rounded-lg border px-3 py-3 transition-colors sm:gap-4 sm:px-4">
      <span
        className="text-muted-foreground flex w-6 shrink-0 items-center justify-center text-sm font-medium tabular-nums"
        aria-hidden
      >
        {rank}
      </span>

      <button
        type="button"
        onClick={onToggle}
        disabled={isToggling}
        title={isLoggedIn ? "Toggle upvote" : "Log in to upvote"}
        aria-pressed={mix.hasUpvoted}
        aria-label={
          mix.hasUpvoted
            ? `Remove upvote from ${mix.title}`
            : `Upvote ${mix.title}`
        }
        className={cn(
          "flex w-14 shrink-0 flex-col items-center justify-center rounded-md border transition-all",
          mix.hasUpvoted
            ? "border-foreground/20 bg-foreground text-background"
            : "border-border bg-background text-foreground hover:border-foreground/40",
          isToggling && "opacity-60",
        )}
      >
        <ChevronUp
          className={cn(
            "size-5 transition-transform",
            mix.hasUpvoted && "scale-110",
          )}
          aria-hidden
        />
        <span className="text-xs font-semibold tabular-nums">
          {mix.periodUpvoteCount}
        </span>
      </button>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h2 className="truncate text-base font-semibold tracking-tight">
            {mix.title}
          </h2>
          <span className="text-muted-foreground text-sm">
            {mix.artist.name}
          </span>
        </div>

        {mix.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed">
            {mix.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {mix.promoter && (
            <span className="text-muted-foreground">{mix.promoter}</span>
          )}
          {mix.genres.map((genre) => (
            <span
              key={genre.id}
              className="bg-muted text-muted-foreground rounded px-1.5 py-0.5"
            >
              {genre.name}
            </span>
          ))}
          {mix.tags.map((tag) => (
            <span key={tag.id} className="text-muted-foreground">
              #{tag.name}
            </span>
          ))}
        </div>
      </div>

      <a
        href={mix.link}
        target="_blank"
        rel="noreferrer"
        className="text-muted-foreground hover:text-foreground flex shrink-0 items-center self-center p-2 transition-colors"
        aria-label={`Open ${mix.title}`}
      >
        <ArrowUpRight className="size-4" />
      </a>
    </li>
  );
}
