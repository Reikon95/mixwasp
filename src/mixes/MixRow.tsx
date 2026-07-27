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
    <li className="mixes-page__row group flex gap-2 bg-card px-2 py-3 transition-colors sm:gap-3 sm:px-4 sm:py-4">
      <div className="flex w-9 shrink-0 flex-col items-center gap-0.5 pt-0.5 sm:w-10">
        {rank !== undefined && (
          <span className="text-muted-foreground text-[10px] font-semibold tabular-nums sm:text-xs">
            #{rank}
          </span>
        )}
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
            "hover:bg-muted flex flex-col items-center rounded-md p-1 transition-colors sm:p-1.5",
            mix.hasFavourited && "text-destructive",
            !mix.hasFavourited && "text-muted-foreground hover:text-destructive",
            isToggling && "opacity-60",
          )}
        >
          <Heart
            className={cn(
              "size-5 sm:size-[22px]",
              mix.hasFavourited && "fill-current",
            )}
            aria-hidden
          />
          <span className="text-[11px] font-bold tabular-nums sm:text-xs">
            {favouriteCount}
          </span>
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-sm leading-snug font-semibold sm:text-base">
          {mix.title}
        </h2>

        <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-1 text-xs leading-relaxed">
          {showArtist && (
            <>
              <span>by</span>
              <WaspRouterLink
                to={routes.ArtistMixesRoute.to}
                params={{ artistId: mix.artist.id }}
                className="text-foreground hover:underline"
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
                className="bg-muted text-muted-foreground hover:text-foreground rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors"
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
                className="hover:text-foreground underline-offset-2 hover:underline"
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
            className="text-muted-foreground hover:bg-muted inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:text-foreground"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Open mix
          </a>
          {showArtist && (
            <WaspRouterLink
              to={routes.ArtistMixesRoute.to}
              params={{ artistId: mix.artist.id }}
              className="text-muted-foreground hover:bg-muted inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:text-foreground"
            >
              More by {mix.artist.name}
            </WaspRouterLink>
          )}
        </div>
      </div>
    </li>
  );
}
