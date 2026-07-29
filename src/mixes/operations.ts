import type { Artist, Genre, Mix, Tag } from "wasp/entities";
import { HttpError, prisma } from "wasp/server";
import type {
  CreateMix,
  GetArtistMixes,
  GetGenreMixes,
  GetMixLinkPreview,
  GetMyFavouriteMixes,
  GetPopularMixes,
  GetTagMixes,
  SearchArtists,
  SearchGenres,
  SearchTags,
  ToggleMixFavourite,
} from "wasp/server/operations";

import * as z from "zod";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";
import {
  createMixInputSchema,
  popularityPeriodSchema,
  type ArtistMix,
  type ArtistMixesResult,
  type CreateMixInput,
  type GenreMixesResult,
  type MixLinkPreviewResult,
  type PopularMix,
  type PopularityPeriod,
  type SearchArtistsInput,
  type SearchNamesInput,
  type TagMixesResult,
  searchArtistsInputSchema,
  searchNamesInputSchema,
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
  return prisma.artist.upsert({
    where: { name },
    update: {},
    create: { name },
  });
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
      return prisma.genre.upsert({
        where: { name },
        update: {},
        create: { name },
      });
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
      return prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      });
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
      favouriteCount: 1,
      artist: { connect: { id: artist.id } },
      genres: genres.length
        ? { connect: genres.map((genre) => ({ id: genre.id })) }
        : undefined,
      tags: tags.length
        ? { connect: tags.map((tag) => ({ id: tag.id })) }
        : undefined,
      favourites: {
        create: {
          user: { connect: { id: context.user.id } },
        },
      },
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
    case "new":
      return null;
  }
}

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

  const userId = context.user.id;

  try {
    return await prisma.$transaction(async (tx) => {
      const mix = await tx.mix.findUnique({
        where: { id: mixId },
        select: { id: true },
      });
      if (!mix) {
        throw new HttpError(404, "Mix not found");
      }

      const existing = await tx.mixFavourite.findUnique({
        where: {
          userId_mixId: { userId, mixId },
        },
      });

      if (existing) {
        await tx.mixFavourite.delete({
          where: { id: existing.id },
        });
      } else {
        await tx.mixFavourite.create({
          data: {
            userId,
            mixId,
          },
        });
      }

      // Recompute from rows so concurrent toggles can't drift the denormalized count.
      const favouriteCount = await tx.mixFavourite.count({
        where: { mixId },
      });
      await tx.mix.update({
        where: { id: mixId },
        data: { favouriteCount },
      });

      return {
        favourited: !existing,
        favouriteCount,
      };
    });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      throw err;
    }
    // Unique race on create — treat as already favourited and reconcile count.
    const favourite = await prisma.mixFavourite.findUnique({
      where: { userId_mixId: { userId, mixId } },
    });
    if (favourite) {
      const favouriteCount = await prisma.mixFavourite.count({
        where: { mixId },
      });
      await prisma.mix.update({
        where: { id: mixId },
        data: { favouriteCount },
      });
      return { favourited: true, favouriteCount };
    }
    throw err;
  }
};

const getPopularMixesInputSchema = z.object({
  period: popularityPeriodSchema.default("all"),
  limit: z.number().int().positive().max(100).default(50),
  genreId: z.number().int().positive().optional(),
  tagId: z.number().int().positive().optional(),
  q: z.string().trim().max(120).optional(),
});

type GetPopularMixesInput = z.input<typeof getPopularMixesInputSchema>;

function buildPopularMixFilters(args: {
  genreId?: number;
  tagId?: number;
  q?: string;
}) {
  const query = args.q?.trim();
  return {
    ...(args.genreId
      ? { genres: { some: { id: args.genreId } } }
      : {}),
    ...(args.tagId ? { tags: { some: { id: args.tagId } } } : {}),
    ...(query
      ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          {
            artist: {
              name: { contains: query, mode: "insensitive" as const },
            },
          },
          { promoter: { contains: query, mode: "insensitive" as const } },
        ],
      }
      : {}),
  };
}

export const getPopularMixes: GetPopularMixes<
  GetPopularMixesInput,
  PopularMix[]
> = async (rawArgs, context) => {
  const { period, limit, genreId, tagId, q } =
    ensureArgsSchemaOrThrowHttpError(getPopularMixesInputSchema, rawArgs ?? {});

  const userId = context.user?.id;
  const since = getPeriodStart(period);
  const filters = buildPopularMixFilters({ genreId, tagId, q });
  const hasFilters = Object.keys(filters).length > 0;

  if (period === "all" || period === "new") {
    const mixes = await context.entities.Mix.findMany({
      where: hasFilters ? filters : undefined,
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
      orderBy:
        period === "new"
          ? [{ createdAt: "desc" }]
          : [{ favouriteCount: "desc" }, { createdAt: "desc" }],
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

  // Over-fetch IDs when filters are active so ranking still fills after filtering.
  const grouped = await prisma.mixFavourite.groupBy({
    by: ["mixId"],
    where: {
      createdAt: { gte: since! },
    },
    _count: { mixId: true },
    orderBy: { _count: { mixId: "desc" } },
    take: hasFilters ? Math.min(limit * 5, 250) : limit,
  });

  const countByMixId = new Map(
    grouped.map((row) => [row.mixId, row._count.mixId]),
  );
  const mixIds = grouped.map((row) => row.mixId);

  const mixQueryInclude = {
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
  };

  const mapMixToPopular = (
    mix: Mix & {
      artist: Artist;
      genres: Genre[];
      tags: Tag[];
      favourites?: { id: string }[];
    },
    periodFavouriteCount: number,
  ): PopularMix => {
    const { favourites, ...rest } = mix;
    return {
      ...rest,
      periodFavouriteCount,
      hasFavourited: (favourites?.length ?? 0) > 0,
    };
  };

  let ranked: PopularMix[] = [];

  if (mixIds.length > 0) {
    const mixes = await context.entities.Mix.findMany({
      where: {
        id: { in: mixIds },
        ...filters,
      },
      include: mixQueryInclude,
    });

    const mixById = new Map(mixes.map((mix) => [mix.id, mix]));

    ranked = mixIds.flatMap((mixId) => {
      const mix = mixById.get(mixId);
      if (!mix) {
        return [];
      }

      return [
        mapMixToPopular(mix, countByMixId.get(mixId) ?? 0),
      ];
    }).slice(0, limit);
  }

  if (ranked.length >= limit) {
    return ranked;
  }

  // Append mixes with no favourites in this period, newest first.
  const rankedIds = ranked.map((mix) => mix.id);
  const zeroPeriodMixes = await context.entities.Mix.findMany({
    where: {
      ...(hasFilters ? filters : {}),
      ...(rankedIds.length > 0 ? { id: { notIn: rankedIds } } : {}),
      favourites: {
        none: {
          createdAt: { gte: since! },
        },
      },
    },
    include: mixQueryInclude,
    orderBy: { createdAt: "desc" },
    take: limit - ranked.length,
  });

  return [
    ...ranked,
    ...zeroPeriodMixes.map((mix) => mapMixToPopular(mix, 0)),
  ];
};

const listMixesLimitSchema = z.number().int().positive().max(100).default(50);

const getArtistMixesInputSchema = z.object({
  artistId: z.number().int().positive(),
  limit: listMixesLimitSchema,
});

type GetArtistMixesInput = z.input<typeof getArtistMixesInputSchema>;

export const getArtistMixes: GetArtistMixes<
  GetArtistMixesInput,
  ArtistMixesResult
> = async (rawArgs, context) => {
  const { artistId, limit } = ensureArgsSchemaOrThrowHttpError(
    getArtistMixesInputSchema,
    rawArgs ?? {},
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
    take: limit,
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

const getGenreMixesInputSchema = z.object({
  genreId: z.number().int().positive(),
  limit: listMixesLimitSchema,
});

type GetGenreMixesInput = z.input<typeof getGenreMixesInputSchema>;

export const getGenreMixes: GetGenreMixes<
  GetGenreMixesInput,
  GenreMixesResult
> = async (rawArgs, context) => {
  const { genreId, limit } = ensureArgsSchemaOrThrowHttpError(
    getGenreMixesInputSchema,
    rawArgs ?? {},
  );

  const genre = await context.entities.Genre.findUnique({
    where: { id: genreId },
  });
  if (!genre) {
    throw new HttpError(404, "Genre not found");
  }

  const userId = context.user?.id;

  const mixes = await context.entities.Mix.findMany({
    where: { genres: { some: { id: genreId } } },
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

  return {
    genre,
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

const getTagMixesInputSchema = z.object({
  tagId: z.number().int().positive(),
  limit: listMixesLimitSchema,
});

type GetTagMixesInput = z.input<typeof getTagMixesInputSchema>;

export const getTagMixes: GetTagMixes<
  GetTagMixesInput,
  TagMixesResult
> = async (rawArgs, context) => {
  const { tagId, limit } = ensureArgsSchemaOrThrowHttpError(
    getTagMixesInputSchema,
    rawArgs ?? {},
  );

  const tag = await context.entities.Tag.findUnique({
    where: { id: tagId },
  });
  if (!tag) {
    throw new HttpError(404, "Tag not found");
  }

  const userId = context.user?.id;

  const mixes = await context.entities.Mix.findMany({
    where: { tags: { some: { id: tagId } } },
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

  return {
    tag,
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

const getMyFavouriteMixesInputSchema = z.object({
  limit: listMixesLimitSchema,
});

type GetMyFavouriteMixesInput = z.input<typeof getMyFavouriteMixesInputSchema>;

export const getMyFavouriteMixes: GetMyFavouriteMixes<
  GetMyFavouriteMixesInput,
  ArtistMix[]
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401, "You must be logged in to view favourites");
  }

  const { limit } = ensureArgsSchemaOrThrowHttpError(
    getMyFavouriteMixesInputSchema,
    rawArgs ?? {},
  );

  const favourites = await context.entities.MixFavourite.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
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

export const searchGenres: SearchGenres<SearchNamesInput, Genre[]> = async (
  rawArgs,
  context,
) => {
  const { query } = ensureArgsSchemaOrThrowHttpError(
    searchNamesInputSchema,
    rawArgs,
  );

  return context.entities.Genre.findMany({
    where: query
      ? { name: { contains: query, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    take: 15,
  });
};

export const searchTags: SearchTags<SearchNamesInput, Tag[]> = async (
  rawArgs,
  context,
) => {
  const { query } = ensureArgsSchemaOrThrowHttpError(
    searchNamesInputSchema,
    rawArgs,
  );

  return context.entities.Tag.findMany({
    where: query
      ? { name: { contains: query, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    take: 15,
  });
};
