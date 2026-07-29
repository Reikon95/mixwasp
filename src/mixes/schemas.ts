import type { Artist, Genre, Mix, Tag } from "wasp/entities";
import * as z from "zod";
import { isAllowedMixLink } from "./mixEmbed";

export const trimmedNonEmpty = z.string().trim().min(1);

export const createMixInputSchema = z.object({
  title: trimmedNonEmpty.max(200),
  artistName: trimmedNonEmpty.max(120),
  link: z
    .url({ error: "Enter a valid URL" })
    .refine(isAllowedMixLink, {
      message: "Link must be a YouTube, SoundCloud, or Mixcloud URL",
    }),
  promoter: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  genres: z.string().trim().max(500).optional().or(z.literal("")),
  tags: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateMixInput = z.input<typeof createMixInputSchema>;

export const popularityPeriodSchema = z.enum([
  "today",
  "week",
  "month",
  "all",
  "new",
]);

export type PopularityPeriod = z.infer<typeof popularityPeriodSchema>;

export type PopularMix = Mix & {
  artist: Artist;
  genres: Genre[];
  tags: Tag[];
  periodFavouriteCount: number;
  hasFavourited: boolean;
};

export type ArtistMix = Mix & {
  artist: Artist;
  genres: Genre[];
  tags: Tag[];
  hasFavourited: boolean;
};

export type ArtistMixesResult = {
  artist: Artist;
  mixes: ArtistMix[];
};

export type TagMixesResult = {
  tag: Tag;
  mixes: ArtistMix[];
};

export type GenreMixesResult = {
  genre: Genre;
  mixes: ArtistMix[];
};

export type MixLinkPreviewResult = {
  platform: "youtube" | "soundcloud" | "mixcloud";
  title: string | null;
  artistName: string | null;
  embed: {
    platform: "youtube" | "soundcloud" | "mixcloud";
    src: string;
  };
};

export const searchArtistsInputSchema = z.object({
  query: z.string().trim().max(120),
});

export type SearchArtistsInput = z.input<typeof searchArtistsInputSchema>;

export const searchNamesInputSchema = searchArtistsInputSchema;

export type SearchNamesInput = z.input<typeof searchNamesInputSchema>;
