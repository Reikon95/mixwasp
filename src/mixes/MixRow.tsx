import { Link as WaspRouterLink, routes } from "wasp/client/router";

import { ArrowUpRight, Heart } from "lucide-react";
import { cn } from "../client/utils";
import type { ArtistMix } from "./schemas";
import { getMixEmbed } from "./mixEmbed";
import { MixEmbedPreview } from "./MixEmbedPreview";

type MixRowMix = ArtistMix & {
  periodFavouriteCount?: number;
};

export function MixRow({
  mix,
  rank,
  favouriteCount,
  isLoggedIn,
  isToggling,
  onToggle,
  showArtist = true,
}: {
  mix: MixRowMix;
  rank?: number;
  favouriteCount: number;
  isLoggedIn: boolean;
  isToggling: boolean;
  onToggle: () => void;
  showArtist?: boolean;
}) {
  const embed = getMixEmbed(mix.link);

  return (
    <li className="mixes-page__row border-border bg-card/40 group flex items-stretch gap-3 rounded-lg border px-3 py-3 transition-colors sm:gap-4 sm:px-4">
      {rank !== undefined && (
        <span
          className="text-muted-foreground flex w-6 shrink-0 items-start justify-center pt-1 text-sm font-medium tabular-nums"
          aria-hidden
        >
          {rank}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2 className="truncate text-base font-semibold tracking-tight">
                {mix.title}
              </h2>
              {showArtist && (
                <WaspRouterLink
                  to={routes.ArtistMixesRoute.to}
                  params={{ artistId: mix.artist.id }}
                  className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
                >
                  {mix.artist.name}
                </WaspRouterLink>
              )}
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

          <div className="flex shrink-0 flex-col items-center gap-2 self-start">
            <button
              type="button"
              onClick={onToggle}
              disabled={isToggling}
              title={isLoggedIn ? "Toggle favourite" : "Log in to favourite"}
              aria-pressed={mix.hasFavourited}
              aria-label={
                mix.hasFavourited
                  ? `Remove ${mix.title} from favourites`
                  : `Favourite ${mix.title}`
              }
              className={cn(
                "flex w-14 flex-col items-center justify-center rounded-md border py-2 transition-all",
                mix.hasFavourited
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border bg-background text-foreground hover:border-destructive/40 hover:text-destructive",
                isToggling && "opacity-60",
              )}
            >
              <Heart
                className={cn(
                  "size-5 transition-transform",
                  mix.hasFavourited && "fill-current scale-110",
                )}
                aria-hidden
              />
              <span className="text-xs font-semibold tabular-nums">
                {favouriteCount}
              </span>
            </button>

            <a
              href={mix.link}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center justify-center rounded-md p-2 transition-colors"
              aria-label={`Open ${mix.title}`}
            >
              <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>

        {embed && <MixEmbedPreview embed={embed} title={mix.title} className="mt-3" />}
      </div>
    </li>
  );
}
