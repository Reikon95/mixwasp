import { createMix, getMixLinkPreview, useQuery } from "wasp/client/operations";
import { useNavigate } from "react-router";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
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
import { MixEmbedPreview } from "./MixEmbedPreview";
import { ArtistCombobox } from "./ArtistCombobox";
import { GenreCombobox, TagCombobox } from "./NameMultiCombobox";
import { isAllowedMixLink } from "./mixEmbed";
import {
  createMixInputSchema,
  type CreateMixInput,
} from "./schemas";

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
  const debouncedLink = useDebounce(link.trim(), 400);
  const canPreview = debouncedLink.length > 0 && isAllowedMixLink(debouncedLink);

  const {
    data: preview,
    isLoading: isPreviewLoading,
    error: previewError,
  } = useQuery(
    getMixLinkPreview,
    { link: debouncedLink },
    { enabled: canPreview },
  );

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
      toast({
        title: "Could not submit mix",
        description: "Check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewTitle = preview?.title ?? form.watch("title") ?? "Mix preview";

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <WaspRouterLink
          to={routes.MixesRoute.to}
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to charts
        </WaspRouterLink>

        <header className="mb-8">
          <p className="text-primary/70 mb-1 text-[11px] tracking-[0.25em] uppercase">
            // uplink
          </p>
          <h1 className="text-phosphor text-3xl font-bold tracking-[0.12em] sm:text-4xl">
            Submit a mix
          </h1>
          <p className="text-muted-foreground mt-2 text-base leading-relaxed">
            Paste a link first — we&apos;ll preview it and pull the title when
            we can. Artist, genre, and tag names are matched to existing ones
            when possible.
          </p>
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
              <Button type="submit" disabled={isSubmitting}>
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
