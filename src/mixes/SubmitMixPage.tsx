import {
  createMix,
  findExistingMix,
  getMixLinkPreview,
  useQuery,
} from "wasp/client/operations";
import { useNavigate } from "react-router";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../client/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../client/components/ui/form";
import { Input } from "../client/components/ui/input";
import { Textarea } from "../client/components/ui/textarea";
import { useDebounce } from "../client/hooks/useDebounce";
import { toast } from "../client/hooks/use-toast";
import { cn } from "../client/utils";
import logo from "../client/static/mixwaspnobg.png";
import { MixEmbedPreview } from "./MixEmbedPreview";
import { ArtistCombobox } from "./ArtistCombobox";
import { GenreCombobox, TagCombobox } from "./NameMultiCombobox";
import { isAllowedMixLink } from "./mixEmbed";
import {
  createMixInputSchema,
  type CreateMixInput,
  type ExistingMixMatch,
} from "./schemas";

function ExistingMixSuggestion({
  match,
  reason,
}: {
  match: ExistingMixMatch;
  reason: "link" | "title";
}) {
  return (
    <div
      role="status"
      className="border-primary/40 bg-primary/5 mt-3 space-y-2 border border-dashed px-3 py-3 text-sm"
    >
      <p className="font-display text-primary text-xs tracking-[0.15em] uppercase">
        {reason === "link"
          ? "This link is already on MixWasp"
          : "A mix with this title already exists"}
      </p>
      <p className="text-foreground leading-snug">
        <span className="font-medium">{match.title}</span>
        <span className="text-muted-foreground"> by </span>
        <WaspRouterLink
          to={routes.ArtistMixesRoute.to}
          params={{ artistId: match.artist.id }}
          className="text-accent hover:text-primary underline-offset-4 hover:underline"
        >
          {match.artist.name}
        </WaspRouterLink>
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <a
          href={match.link}
          target="_blank"
          rel="noreferrer"
          className="text-primary inline-flex items-center gap-1 text-xs tracking-wide uppercase underline-offset-4 hover:underline"
        >
          Open mix
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
        <WaspRouterLink
          to={routes.BrowseMixesRoute.to}
          className="text-muted-foreground hover:text-primary text-xs tracking-wide uppercase underline-offset-4 hover:underline"
        >
          Find it in Browse
        </WaspRouterLink>
      </div>
    </div>
  );
}

export function SubmitMixPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoFilledRef = useRef<{ title?: string }>({});

  const form = useForm<CreateMixInput>({
    resolver: zodResolver(createMixInputSchema),
    defaultValues: {
      title: "",
      artistName: "",
      link: "",
      promoter: "",
      description: "",
      genres: "",
      tags: "",
    },
  });

  const link = form.watch("link");
  const title = form.watch("title");
  const debouncedLink = useDebounce(link.trim(), 400);
  const debouncedTitle = useDebounce(title.trim(), 400);
  const canPreview = debouncedLink.length > 0 && isAllowedMixLink(debouncedLink);
  const canCheckExisting =
    debouncedLink.length > 0 || debouncedTitle.length > 0;

  const {
    data: preview,
    isLoading: isPreviewLoading,
    error: previewError,
  } = useQuery(
    getMixLinkPreview,
    { link: debouncedLink },
    { enabled: canPreview },
  );

  const { data: existingMatches } = useQuery(
    findExistingMix,
    {
      link: debouncedLink || undefined,
      title: debouncedTitle || undefined,
    },
    { enabled: canCheckExisting },
  );

  const linkMatch = existingMatches?.linkMatch ?? null;
  const distinctTitleMatch =
    existingMatches?.titleMatch &&
    (!linkMatch || existingMatches.titleMatch.id !== linkMatch.id)
      ? existingMatches.titleMatch
      : null;

  const hasBlockingDuplicate = Boolean(linkMatch || distinctTitleMatch);

  useEffect(() => {
    if (!preview) {
      return;
    }

    if (preview.title) {
      const currentTitle = form.getValues("title");
      if (
        !currentTitle.trim() ||
        currentTitle === autoFilledRef.current.title
      ) {
        form.setValue("title", preview.title, {
          shouldValidate: true,
          shouldDirty: true,
        });
        autoFilledRef.current.title = preview.title;
      }
    }
  }, [preview, form]);

  const onSubmit = async (values: CreateMixInput) => {
    if (hasBlockingDuplicate) {
      toast({
        title: "Mix already exists",
        description: "Use the suggestion below — no need to submit it again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const mix = await createMix(values);
      toast({
        title: "Mix submitted",
        description: `"${mix.title}" is live on the charts.`,
      });
      navigate(routes.MixesRoute.to);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Check your details and try again.";
      toast({
        title: "Could not submit mix",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewTitle = preview?.title ?? form.watch("title") ?? "Mix preview";
  const vinylSpinning = isSubmitting || isPreviewLoading;

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <WaspRouterLink
          to={routes.MixesRoute.to}
          className="text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-1.5 text-sm tracking-wide uppercase transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to charts
        </WaspRouterLink>

        <header className="mb-8 flex items-center gap-4 sm:gap-5">
          <div
            className={cn(
              "submit-vinyl relative shrink-0 rounded-full p-[3px]",
              vinylSpinning && "submit-vinyl--live",
            )}
            aria-hidden
          >
            <div className="border-primary/35 bg-card/60 relative overflow-hidden rounded-full border shadow-[0_0_28px_hsl(var(--glow)/0.35)]">
              <img
                src={logo}
                alt=""
                className={cn(
                  "size-16 rounded-full sm:size-[4.5rem]",
                  vinylSpinning
                    ? "animate-[spin_2.4s_linear_infinite]"
                    : "animate-[spin_18s_linear_infinite]",
                )}
              />
              <span className="bg-background/90 border-primary/50 absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border sm:size-3" />
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-primary/70 mb-1 text-[11px] tracking-[0.25em] uppercase">
              // uplink
            </p>
            <h1 className="text-phosphor text-3xl font-bold tracking-[0.12em] sm:text-5xl">
              Submit a mix
            </h1>
          </div>
        </header>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://soundcloud.com/..."
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    YouTube, SoundCloud, or Mixcloud only.
                  </FormDescription>
                  <FormMessage />

                  {linkMatch && (
                    <ExistingMixSuggestion match={linkMatch} reason="link" />
                  )}

                  {canPreview && isPreviewLoading && (
                    <p className="text-muted-foreground pt-2 text-sm">
                      Fetching preview…
                    </p>
                  )}

                  {canPreview && previewError && (
                    <p className="text-muted-foreground pt-2 text-sm">
                      Could not load metadata for this link, but you can still
                      submit it.
                    </p>
                  )}

                  {preview?.embed && (
                    <MixEmbedPreview
                      embed={preview.embed}
                      title={previewTitle}
                      className="mt-3"
                    />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Warehouse Soft Open"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {distinctTitleMatch && (
                    <ExistingMixSuggestion
                      match={distinctTitleMatch}
                      reason="title"
                    />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="artistName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist</FormLabel>
                  <FormControl>
                    <ArtistCombobox
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Search existing artists or type a new name to create one.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="promoter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Promoter (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="North Dock"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What should people know about this set?"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="genres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genres (optional)</FormLabel>
                  <FormControl>
                    <GenreCombobox
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Search existing genres or create new ones.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (optional)</FormLabel>
                  <FormControl>
                    <TagCombobox
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Search existing tags or create new ones.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || hasBlockingDuplicate}
              >
                {isSubmitting ? "Submitting…" : "Submit mix"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => navigate(routes.MixesRoute.to)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
