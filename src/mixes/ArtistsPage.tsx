import { listArtists, useQuery } from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "../client/components/ui/input";
import { MixWaspLoader } from "../client/components/MixWaspLoader";
import { useDebounce } from "../client/hooks/useDebounce";

export function ArtistsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 300);

  const {
    data: artists,
    isLoading,
    error,
  } = useQuery(listArtists, {
    limit: 100,
    q: debouncedSearch || undefined,
  });

  const hasSearch = debouncedSearch.length > 0;
  const showEmpty =
    !isLoading && artists !== undefined && artists.length === 0;

  return (
    <main className="mixes-page px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mixes-page__intro mb-6">
          <p className="text-primary/70 mb-1 text-[11px] tracking-[0.25em] uppercase">
            // mixwasp
          </p>
          <h1 className="text-phosphor terminal-cursor text-2xl font-bold tracking-[0.12em] sm:text-3xl">
            Artists
          </h1>
          <p className="text-muted-foreground mt-2 text-sm tracking-wide">
            Browse every artist on the platform and open their mixes.
          </p>
        </header>

        <div className="mixes-page__filters mb-6">
          <label className="relative block">
            <span className="sr-only">Search artists</span>
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search artists…"
              className="pl-9"
              autoComplete="off"
            />
          </label>
        </div>

        {isLoading && <MixWaspLoader label="Loading artists" />}

        {error && (
          <p className="text-destructive text-sm tracking-wide">
            [ERR] Something went wrong loading artists.
          </p>
        )}

        {showEmpty && (
          <div className="border-primary/30 bg-card/40 rounded-sm border border-dashed px-6 py-12 text-center">
            <p className="font-display text-primary text-sm tracking-[0.15em]">
              {hasSearch ? "No artists match this search" : "No artists yet"}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              {hasSearch
                ? "Try a different name."
                : "Artists appear here once mixes are submitted."}
            </p>
          </div>
        )}

        {artists && artists.length > 0 && (
          <ul className="mixes-page__list divide-border divide-y border-y border-border">
            {artists.map((artist) => (
              <li key={artist.id} className="mixes-page__row">
                <WaspRouterLink
                  to={routes.ArtistMixesRoute.to}
                  params={{ artistId: artist.id }}
                  className="group flex items-baseline justify-between gap-4 px-2 py-3 transition-colors sm:px-4 sm:py-3.5"
                >
                  <span className="text-foreground group-hover:text-primary text-base font-medium tracking-wide transition-colors">
                    {artist.name}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs tracking-wider uppercase">
                    {artist.mixCount === 1
                      ? "1 mix"
                      : `${artist.mixCount} mixes`}
                  </span>
                </WaspRouterLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
