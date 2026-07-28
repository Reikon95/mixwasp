import { Link as WaspRouterLink, routes } from "wasp/client/router";

import { ExternalLink, Heart } from "lucide-react";
import { cn } from "../client/utils";
import type { ArtistMix } from "./schemas";
import { getMixEmbed } from "./mixEmbed";
import { MixEmbedPreview } from "./MixEmbedPreview";

type MixRowMix = ArtistMix & {
  periodFavouriteCount?: number;
};

function MetaSeparator() {
  return (
    <span className="text-muted-foreground/50 px-0.5" aria-hidden>
      ·
    </span>
  );
}

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
    <li className="mixes-page__row group flex gap-2 px-2 py-3 sm:gap-3 sm:px-4 sm:py-4">
      {rank !== undefined && (
        <div className="flex w-11 shrink-0 flex-col items-center justify-start pt-0.5 sm:w-14">
          <span
            className={cn(
              "font-display text-primary leading-none font-bold tabular-nums tracking-wider",
              rank <= 3
                ? "text-phosphor text-xl sm:text-2xl"
                : "text-lg opacity-90 sm:text-xl",
            )}
            aria-label={`Rank ${rank}`}
          >
            {String(rank).padStart(2, "0")}
          </span>
        </div>
      )}

      <div className="flex w-9 shrink-0 flex-col items-center gap-0.5 pt-0.5 sm:w-10">
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
            "hover:bg-primary/10 flex flex-col items-center rounded-sm p-1 transition-colors sm:p-1.5",
            mix.hasFavourited && "text-secondary",
            !mix.hasFavourited && "text-muted-foreground hover:text-secondary",
            isToggling && "opacity-60",
          )}
        >
          <Heart
            className={cn(
              "size-5 sm:size-[22px]",
              mix.hasFavourited &&
                "fill-current drop-shadow-[0_0_8px_hsl(var(--neon)/0.7)]",
            )}
            aria-hidden
          />
          <span className="text-[11px] font-bold tabular-nums sm:text-xs">
            {favouriteCount}
          </span>
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-foreground group-hover:text-primary text-sm leading-snug font-semibold tracking-wide transition-colors sm:text-base">
          {mix.title}
        </h2>

        <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-1 text-xs leading-relaxed">
          {showArtist && (
            <>
              <span>by</span>
              <WaspRouterLink
                to={routes.ArtistMixesRoute.to}
                params={{ artistId: mix.artist.id }}
                className="text-accent hover:text-primary transition-colors"
              >
                {mix.artist.name}
              </WaspRouterLink>
            </>
          )}
          {mix.promoter && (
            <>
              {showArtist && <MetaSeparator />}
              <span>{mix.promoter}</span>
            </>
          )}
          {mix.genres.map((genre, index) => (
            <span key={genre.id} className="inline-flex items-center">
              {(showArtist || mix.promoter || index > 0) && <MetaSeparator />}
              <WaspRouterLink
                to={routes.GenreMixesRoute.to}
                params={{ genreId: genre.id }}
                className="border-primary/25 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/10 rounded-sm border px-2 py-0.5 text-[11px] font-medium tracking-wide transition-colors"
              >
                {genre.name}
              </WaspRouterLink>
            </span>
          ))}
          {mix.tags.map((tag) => (
            <span key={tag.id} className="inline-flex items-center">
              <MetaSeparator />
              <WaspRouterLink
                to={routes.TagMixesRoute.to}
                params={{ tagId: tag.id }}
                className="text-secondary/80 hover:text-secondary underline-offset-2 hover:underline"
              >
                #{tag.name}
              </WaspRouterLink>
            </span>
          ))}
        </p>

        {mix.description && (
          <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed">
            {mix.description}
          </p>
        )}

        {embed && (
          <MixEmbedPreview
            embed={embed}
            title={mix.title}
            className="mt-2 sm:mt-3"
          />
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3">
          <a
            href={mix.link}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:border-primary/40 hover:text-primary inline-flex items-center gap-1 rounded-sm border border-transparent px-2.5 py-1 text-xs font-medium tracking-wide uppercase transition-colors"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Open mix
          </a>
          {showArtist && (
            <WaspRouterLink
              to={routes.ArtistMixesRoute.to}
              params={{ artistId: mix.artist.id }}
              className="text-muted-foreground hover:border-primary/40 hover:text-primary inline-flex items-center rounded-sm border border-transparent px-2.5 py-1 text-xs font-medium tracking-wide uppercase transition-colors"
            >
              More by {mix.artist.name}
            </WaspRouterLink>
          )}
        </div>
      </div>
    </li>
  );
}
