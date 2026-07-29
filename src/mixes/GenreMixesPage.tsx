import { useAuth } from "wasp/client/auth";
import {
  getGenreMixes,
  toggleMixFavourite,
  useQuery,
} from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";
import { Button } from "../client/components/ui/button";
import { MixWaspLoader } from "../client/components/MixWaspLoader";
import { toast } from "../client/hooks/use-toast";
import { MixFeed } from "./MixFeed";
import { MixRow } from "./MixRow";

export function GenreMixesPage() {
  const { genreId: genreIdParam } = useParams<"genreId">();
  const genreId = Number(genreIdParam);
  const { data: user } = useAuth();
  const [togglingMixId, setTogglingMixId] = useState<number | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery(
    getGenreMixes,
    { genreId },
    { enabled: Number.isInteger(genreId) && genreId > 0 },
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

  if (!Number.isInteger(genreId) || genreId <= 0) {
    return (
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-medium">Invalid genre</p>
          <Button asChild variant="outline" className="mt-4">
            <WaspRouterLink to={routes.GenresRoute.to}>Back to genres</WaspRouterLink>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <WaspRouterLink
          to={routes.GenresRoute.to}
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to genres
        </WaspRouterLink>

        {isLoading && <MixWaspLoader label="Loading mixes" />}

        {error && (
          <p className="text-destructive text-sm">
            Something went wrong loading this genre.
          </p>
        )}

        {data && (
          <>
            <header className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {data.genre.name}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {data.mixes.length === 1
                  ? "1 mix in this genre"
                  : `${data.mixes.length} mixes in this genre`}
              </p>
            </header>

            {data.mixes.length === 0 ? (
              <div className="border-border rounded-md border border-dashed px-6 py-12 text-center">
                <p className="font-medium">No mixes yet</p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Nothing has been filed under this genre yet.
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
