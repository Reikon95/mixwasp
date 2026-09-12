import { useAuth } from "wasp/client/auth";
import { getArtistMixes, toggleMixFavourite, useQuery } from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";
import { Button } from "../client/components/ui/button";
import { MixWaspLoader } from "../client/components/MixWaspLoader";
import { toast } from "../client/hooks/use-toast";
import { MixFeed } from "./MixFeed";
import { MixRow } from "./MixRow";
import logo from "../client/static/mixwaspnobg.png";

function ArtistImageFrame({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl: string | null;
  className?: string;
}) {
  return (
    <div
      className={className}
      aria-label={imageUrl ? `${name} image` : `${name} (MixWasp logo)`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <div className="bg-card/60 flex size-full items-center justify-center p-8">
          <img
            src={logo}
            alt=""
            className="max-h-full max-w-[70%] object-contain opacity-90"
          />
        </div>
      )}
    </div>
  );
}

export function ArtistMixesPage() {
  const { artistId: artistIdParam } = useParams<"artistId">();
  const artistId = Number(artistIdParam);
  const { data: user } = useAuth();
  const [togglingMixId, setTogglingMixId] = useState<number | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery(
    getArtistMixes,
    { artistId },
    { enabled: Number.isInteger(artistId) && artistId > 0 },
  );

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

  if (!Number.isInteger(artistId) || artistId <= 0) {
    return (
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-medium">Invalid artist</p>
          <Button asChild variant="outline" className="mt-4">
            <WaspRouterLink to={routes.ArtistsRoute.to}>Back to artists</WaspRouterLink>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl lg:max-w-6xl">
        {isLoading && <MixWaspLoader label="Loading mixes" />}

        {error && (
          <p className="text-destructive text-sm">
            Something went wrong loading this artist.
          </p>
        )}

        {data && (
          <div className="lg:grid lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
            {/* Laptop+: full side column */}
            <aside className="border-primary/35 bg-card/40 sticky top-24 hidden overflow-hidden border border-dashed lg:block">
              <ArtistImageFrame
                name={data.artist.name}
                imageUrl={data.artist.imageUrl}
                className="aspect-[3/4] w-full"
              />
            </aside>

            <div className="min-w-0">
              <WaspRouterLink
                to={routes.ArtistsRoute.to}
                className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm transition-colors lg:mb-8"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back to artists
              </WaspRouterLink>

              {/* Phone: image as hero background */}
              <header className="artist-page__hero border-primary/25 relative mb-8 overflow-hidden border lg:mb-6 lg:border-0">
                <div className="absolute inset-0 lg:hidden" aria-hidden>
                  {data.artist.imageUrl ? (
                    <img
                      src={data.artist.imageUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="bg-card/60 flex size-full items-center justify-center p-10">
                      <img
                        src={logo}
                        alt=""
                        className="max-h-40 max-w-[55%] object-contain opacity-80"
                      />
                    </div>
                  )}
                  <div className="from-background via-background/85 to-background/30 absolute inset-0 bg-gradient-to-t" />
                </div>

                <div className="relative flex min-h-[16rem] flex-col justify-end p-4 sm:min-h-[18rem] sm:p-5 lg:min-h-0 lg:p-0">
                  <p className="text-primary/80 mb-1 text-[11px] tracking-[0.25em] uppercase">
                    // artist
                  </p>
                  <h1 className="text-phosphor text-2xl font-bold tracking-[0.12em] sm:text-3xl">
                    {data.artist.name}
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm tracking-wide">
                    {data.mixes.length === 1
                      ? "1 mix on MixWasp"
                      : `${data.mixes.length} mixes on MixWasp`}
                  </p>
                </div>
              </header>

              {data.mixes.length === 0 ? (
                <div className="border-border rounded-md border border-dashed px-6 py-12 text-center">
                  <p className="font-medium">No mixes yet</p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    This artist hasn&apos;t been linked to any mixes.
                  </p>
                </div>
              ) : (
                <MixFeed>
                  <ol>
                    {data.mixes.map((mix, index) => (
                      <MixRow
                        key={mix.id}
                        mix={mix}
                        rank={index + 1}
                        favouriteCount={mix.favouriteCount}
                        isLoggedIn={!!user}
                        isToggling={togglingMixId === mix.id}
                        onToggle={() => handleToggleFavourite(mix.id)}
                        showArtist={false}
                      />
                    ))}
                  </ol>
                </MixFeed>
              )}

              {!user && data.mixes.length > 0 && (
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
          </div>
        )}
      </div>
    </main>
  );
}
