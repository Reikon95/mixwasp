import type { Artist, Genre, Mix, Tag } from "wasp/entities";
import { HttpError, prisma } from "wasp/server";
import type {
  CreateMix,
  EnsureDemoMixes,
  GetArtistMixes,
  GetMixLinkPreview,
  GetMyFavouriteMixes,
  GetPopularMixes,
  SearchArtists,
  ToggleMixFavourite,
} from "wasp/server/operations";

import * as z from "zod";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";
import { ensureDemoMixesSeeded } from "./seedDemoMixes";
import {
  createMixInputSchema,
  popularityPeriodSchema,
  type ArtistMix,
  type ArtistMixesResult,
  type CreateMixInput,
  type MixLinkPreviewResult,
  type PopularMix,
  type PopularityPeriod,
  type SearchArtistsInput,
  searchArtistsInputSchema,
} from "./schemas";
import { fetchMixLinkPreview } from "./mixLinkPreview";
import { isAllowedMixLink } from "./mixEmbed";

function parseNameList(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  const names = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return [...new Set(names.map((name) => name.replace(/\s+/g, " ")))];
}

async function findOrCreateArtistByName(name: string): Promise<Artist> {
  const existing = await prisma.artist.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    return existing;
  }
  return prisma.artist.create({ data: { name } });
}

async function findOrCreateGenresByName(names: string[]): Promise<Genre[]> {
  return Promise.all(
    names.map(async (name) => {
      const existing = await prisma.genre.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
      });
      if (existing) {
        return existing;
      }
      return prisma.genre.create({ data: { name } });
    }),
  );
}

async function findOrCreateTagsByName(names: string[]): Promise<Tag[]> {
  return Promise.all(
    names.map(async (name) => {
      const existing = await prisma.tag.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
      });
      if (existing) {
        return existing;
      }
      return prisma.tag.create({ data: { name } });
    }),
  );
}

type CreatedMix = Mix & {
  artist: Artist;
  genres: Genre[];
  tags: Tag[];
};

const mixInclude = {
  artist: true,
  genres: true,
  tags: true,
} as const;

export const createMix: CreateMix<CreateMixInput, CreatedMix> = async (
  rawArgs,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401, "You must be logged in to submit a mix");
  }

  const args = ensureArgsSchemaOrThrowHttpError(createMixInputSchema, rawArgs);

  const artist = await findOrCreateArtistByName(args.artistName);
  const genres = await findOrCreateGenresByName(parseNameList(args.genres));
  const tags = await findOrCreateTagsByName(parseNameList(args.tags));

  return context.entities.Mix.create({
    data: {
      title: args.title,
      link: args.link,
      promoter: args.promoter || null,
      description: args.description || null,
      artist: { connect: { id: artist.id } },
      genres: genres.length
        ? { connect: genres.map((genre) => ({ id: genre.id })) }
        : undefined,
      tags: tags.length
        ? { connect: tags.map((tag) => ({ id: tag.id })) }
        : undefined,
    },
    include: mixInclude,
  });
};

function getPeriodStart(period: PopularityPeriod): Date | null {
  const now = new Date();

  switch (period) {
    case "today":
      return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    case "all":
      return null;
  }
}

export const ensureDemoMixes: EnsureDemoMixes<
  void,
  { seeded: boolean; mixCount: number }
> = async (_args, _context) => {
  return ensureDemoMixesSeeded(prisma);
};

const toggleMixFavouriteInputSchema = z.object({
  mixId: z.number().int().positive(),
});

type ToggleMixFavouriteInput = z.infer<typeof toggleMixFavouriteInputSchema>;

type ToggleMixFavouriteResult = {
  favourited: boolean;
  favouriteCount: number;
};

export const toggleMixFavourite: ToggleMixFavourite<
  ToggleMixFavouriteInput,
  ToggleMixFavouriteResult
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401, "You must be logged in to favourite a mix");
  }

  const { mixId } = ensureArgsSchemaOrThrowHttpError(
    toggleMixFavouriteInputSchema,
    rawArgs,
  );

  const mix = await context.entities.Mix.findUnique({
    where: { id: mixId },
  });
  if (!mix) {
    throw new HttpError(404, "Mix not found");
  }

  const existing = await context.entities.MixFavourite.findUnique({
    where: {
      userId_mixId: {
        userId: context.user.id,
        mixId,
      },
    },
  });

  if (existing) {
    const [, updatedMix] = await prisma.$transaction([
      context.entities.MixFavourite.delete({
        where: { id: existing.id },
      }),
      context.entities.Mix.update({
        where: { id: mixId },
        data: {
          favouriteCount: {
            decrement: mix.favouriteCount > 0 ? 1 : 0,
          },
        },
      }),
    ]);

    return {
      favourited: false,
      favouriteCount: Math.max(0, updatedMix.favouriteCount),
    };
  }

  const [, updatedMix] = await prisma.$transaction([
    context.entities.MixFavourite.create({
      data: {
        user: { connect: { id: context.user.id } },
        mix: { connect: { id: mixId } },
      },
    }),
    context.entities.Mix.update({
      where: { id: mixId },
      data: { favouriteCount: { increment: 1 } },
    }),
  ]);

  return {
    favourited: true,
    favouriteCount: updatedMix.favouriteCount,
  };
};

const getPopularMixesInputSchema = z.object({
  period: popularityPeriodSchema.default("all"),
  limit: z.number().int().positive().max(100).default(50),
});

type GetPopularMixesInput = z.input<typeof getPopularMixesInputSchema>;

export const getPopularMixes: GetPopularMixes<
  GetPopularMixesInput,
  PopularMix[]
> = async (rawArgs, context) => {
  const { period, limit } = ensureArgsSchemaOrThrowHttpError(
    getPopularMixesInputSchema,
    rawArgs ?? {},
  );

  const userId = context.user?.id;
  const since = getPeriodStart(period);

  if (period === "all") {
    const mixes = await context.entities.Mix.findMany({
      include: {
        ...mixInclude,
        ...(userId
          ? {
              favourites: {
                where: { userId },
                select: { id: true },
                take: 1,
              },
            }
          : {}),
      },
      orderBy: [{ favouriteCount: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return mixes.map((mix) => {
      const { favourites, ...rest } = mix as typeof mix & {
        favourites?: { id: string }[];
      };
      return {
        ...rest,
        periodFavouriteCount: rest.favouriteCount,
        hasFavourited: (favourites?.length ?? 0) > 0,
      };
    });
  }

  const grouped = await prisma.mixFavourite.groupBy({
    by: ["mixId"],
    where: {
      createdAt: { gte: since! },
    },
    _count: { mixId: true },
    orderBy: { _count: { mixId: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) {
    return [];
  }

  const countByMixId = new Map(
    grouped.map((row) => [row.mixId, row._count.mixId]),
  );
  const mixIds = grouped.map((row) => row.mixId);

  const mixes = await context.entities.Mix.findMany({
    where: { id: { in: mixIds } },
    include: {
      ...mixInclude,
      ...(userId
        ? {
            favourites: {
              where: { userId },
              select: { id: true },
              take: 1,
            },
          }
        : {}),
    },
  });

  const mixById = new Map(mixes.map((mix) => [mix.id, mix]));

  return mixIds.flatMap((mixId) => {
    const mix = mixById.get(mixId);
    if (!mix) {
      return [];
    }

    const { favourites, ...rest } = mix as typeof mix & {
      favourites?: { id: string }[];
    };

    return [
      {
        ...rest,
        periodFavouriteCount: countByMixId.get(mixId) ?? 0,
        hasFavourited: (favourites?.length ?? 0) > 0,
      },
    ];
  });
};

const getArtistMixesInputSchema = z.object({
  artistId: z.number().int().positive(),
});

type GetArtistMixesInput = z.infer<typeof getArtistMixesInputSchema>;

export const getArtistMixes: GetArtistMixes<
  GetArtistMixesInput,
  ArtistMixesResult
> = async (rawArgs, context) => {
  const { artistId } = ensureArgsSchemaOrThrowHttpError(
    getArtistMixesInputSchema,
    rawArgs,
  );

  const artist = await context.entities.Artist.findUnique({
    where: { id: artistId },
  });
  if (!artist) {
    throw new HttpError(404, "Artist not found");
  }

  const userId = context.user?.id;

  const mixes = await context.entities.Mix.findMany({
    where: { artistId },
    include: {
      ...mixInclude,
      ...(userId
        ? {
            favourites: {
              where: { userId },
              select: { id: true },
              take: 1,
            },
          }
        : {}),
    },
    orderBy: [{ favouriteCount: "desc" }, { createdAt: "desc" }],
  });

  return {
    artist,
    mixes: mixes.map((mix) => {
      const { favourites, ...rest } = mix as typeof mix & {
        favourites?: { id: string }[];
      };
      return {
        ...rest,
        hasFavourited: (favourites?.length ?? 0) > 0,
      } satisfies ArtistMix;
    }),
  };
};

export const getMyFavouriteMixes: GetMyFavouriteMixes<
  void,
  ArtistMix[]
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, "You must be logged in to view favourites");
  }

  const favourites = await context.entities.MixFavourite.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      mix: {
        include: mixInclude,
      },
    },
  });

  return favourites.map(({ mix }) => ({
    ...mix,
    hasFavourited: true,
  }));
};

const getMixLinkPreviewInputSchema = z.object({
  link: z.url(),
});

type GetMixLinkPreviewInput = z.infer<typeof getMixLinkPreviewInputSchema>;

export const getMixLinkPreview: GetMixLinkPreview<
  GetMixLinkPreviewInput,
  MixLinkPreviewResult
> = async (rawArgs, _context) => {
  const { link } = ensureArgsSchemaOrThrowHttpError(
    getMixLinkPreviewInputSchema,
    rawArgs,
  );

  if (!isAllowedMixLink(link)) {
    throw new HttpError(
      400,
      "Link must be a YouTube, SoundCloud, or Mixcloud URL",
    );
  }

  return fetchMixLinkPreview(link);
};

export const searchArtists: SearchArtists<
  SearchArtistsInput,
  Artist[]
> = async (rawArgs, context) => {
  const { query } = ensureArgsSchemaOrThrowHttpError(
    searchArtistsInputSchema,
    rawArgs,
  );

  return context.entities.Artist.findMany({
    where: query
      ? { name: { contains: query, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    take: 15,
  });
};
