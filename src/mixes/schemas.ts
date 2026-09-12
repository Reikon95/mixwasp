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
      message:
        "Link must be a YouTube, SoundCloud, or Mixcloud URL",
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

export type ListedArtist = Artist & {
  mixCount: number;
};

export type ListedGenre = Genre & {
  mixCount: number;
};

export const searchArtistsInputSchema = z.object({
  query: z.string().trim().max(120),
});

export type SearchArtistsInput = z.input<typeof searchArtistsInputSchema>;

export const searchNamesInputSchema = searchArtistsInputSchema;

export type SearchNamesInput = z.input<typeof searchNamesInputSchema>;

export const toggleMixFavouriteInputSchema = z.object({
  mixId: z.number().int().positive(),
});

export type ToggleMixFavouriteInput = z.infer<
  typeof toggleMixFavouriteInputSchema
>;

export const getPopularMixesInputSchema = z.object({
  period: popularityPeriodSchema.default("all"),
  limit: z.number().int().positive().max(100).default(50),
  genreId: z.number().int().positive().optional(),
  tagId: z.number().int().positive().optional(),
  q: z.string().trim().max(120).optional(),
});

export type GetPopularMixesInput = z.input<typeof getPopularMixesInputSchema>;

export const browseMixesInputSchema = z.object({
  limit: z.number().int().positive().max(100).default(50),
  genreId: z.number().int().positive().optional(),
  tagId: z.number().int().positive().optional(),
  q: z.string().trim().max(120).optional(),
});

export type BrowseMixesInput = z.input<typeof browseMixesInputSchema>;

export const listMixesLimitSchema = z
  .number()
  .int()
  .positive()
  .max(100)
  .default(50);

export const getArtistMixesInputSchema = z.object({
  artistId: z.number().int().positive(),
  limit: listMixesLimitSchema,
});

export type GetArtistMixesInput = z.input<typeof getArtistMixesInputSchema>;

export const getGenreMixesInputSchema = z.object({
  genreId: z.number().int().positive(),
  limit: listMixesLimitSchema,
});

export type GetGenreMixesInput = z.input<typeof getGenreMixesInputSchema>;

export const getTagMixesInputSchema = z.object({
  tagId: z.number().int().positive(),
  limit: listMixesLimitSchema,
});

export type GetTagMixesInput = z.input<typeof getTagMixesInputSchema>;

export const getMyFavouriteMixesInputSchema = z.object({
  limit: listMixesLimitSchema,
});

export type GetMyFavouriteMixesInput = z.input<
  typeof getMyFavouriteMixesInputSchema
>;

export const getMixLinkPreviewInputSchema = z.object({
  link: z.url(),
});

export type GetMixLinkPreviewInput = z.infer<
  typeof getMixLinkPreviewInputSchema
>;

export const listArtistsInputSchema = z.object({
  q: z.string().trim().max(120).optional(),
  limit: z.number().int().positive().max(200).default(100),
});

export type ListArtistsInput = z.input<typeof listArtistsInputSchema>;

export const listGenresInputSchema = z.object({
  q: z.string().trim().max(120).optional(),
  limit: z.number().int().positive().max(200).default(100),
});

export type ListGenresInput = z.input<typeof listGenresInputSchema>;

export const findExistingMixInputSchema = z
  .object({
    title: z.string().trim().max(200).optional(),
    link: z.string().trim().max(2000).optional(),
  })
  .refine((value) => Boolean(value.title?.trim() || value.link?.trim()), {
    message: "Provide a title or link to check",
  });

export type FindExistingMixInput = z.input<typeof findExistingMixInputSchema>;

export type ExistingMixMatch = Mix & {
  artist: Artist;
};

export type FindExistingMixResult = {
  linkMatch: ExistingMixMatch | null;
  titleMatch: ExistingMixMatch | null;
};
