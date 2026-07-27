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
            <WaspRouterLink to={routes.MixesRoute.to}>Back to charts</WaspRouterLink>
          </Button>
        </div>
      </main>
    );
  }

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

        {isLoading && <MixWaspLoader label="Loading mixes" />}

        {error && (
          <p className="text-destructive text-sm">
            Something went wrong loading this artist.
          </p>
        )}

        {data && (
          <>
            <header className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {data.artist.name}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {data.mixes.length === 1
                  ? "1 mix on MixWasp"
                  : `${data.mixes.length} mixes on MixWasp`}
              </p>
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
                  {data.mixes.map((mix) => (
                    <MixRow
                      key={mix.id}
                      mix={mix}
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
          </>
        )}

        {!user && data && data.mixes.length > 0 && (
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
