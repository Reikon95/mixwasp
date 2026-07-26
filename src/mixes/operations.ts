import type { Artist, Genre, Mix, Tag } from "wasp/entities";
import { HttpError, prisma } from "wasp/server";
import type {
  EnsureDemoMixes,
  GetPopularMixes,
  ToggleMixUpvote,
} from "wasp/server/operations";

import * as z from "zod";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";
import { ensureDemoMixesSeeded } from "./seedDemoMixes";

export const popularityPeriodSchema = z.enum([
  "today",
  "week",
  "month",
  "all",
]);

export type PopularityPeriod = z.infer<typeof popularityPeriodSchema>;

export type PopularMix = Mix & {
  artist: Artist;
  genres: Genre[];
  tags: Tag[];
  periodUpvoteCount: number;
  hasUpvoted: boolean;
};

const mixInclude = {
  artist: true,
  genres: true,
  tags: true,
} as const;

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
      return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
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

const toggleMixUpvoteInputSchema = z.object({
  mixId: z.number().int().positive(),
});

type ToggleMixUpvoteInput = z.infer<typeof toggleMixUpvoteInputSchema>;

type ToggleMixUpvoteResult = {
  upvoted: boolean;
  upvoteCount: number;
};

export const toggleMixUpvote: ToggleMixUpvote<
  ToggleMixUpvoteInput,
  ToggleMixUpvoteResult
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401, "You must be logged in to upvote");
  }

  const { mixId } = ensureArgsSchemaOrThrowHttpError(
    toggleMixUpvoteInputSchema,
    rawArgs,
  );

  const mix = await context.entities.Mix.findUnique({
    where: { id: mixId },
  });
  if (!mix) {
    throw new HttpError(404, "Mix not found");
  }

  const existing = await context.entities.MixUpvote.findUnique({
    where: {
      userId_mixId: {
        userId: context.user.id,
        mixId,
      },
    },
  });

  if (existing) {
    const [, updatedMix] = await prisma.$transaction([
      context.entities.MixUpvote.delete({
        where: { id: existing.id },
      }),
      context.entities.Mix.update({
        where: { id: mixId },
        data: {
          upvoteCount: {
            decrement: mix.upvoteCount > 0 ? 1 : 0,
          },
        },
      }),
    ]);

    return {
      upvoted: false,
      upvoteCount: Math.max(0, updatedMix.upvoteCount),
    };
  }

  const [, updatedMix] = await prisma.$transaction([
    context.entities.MixUpvote.create({
      data: {
        user: { connect: { id: context.user.id } },
        mix: { connect: { id: mixId } },
      },
    }),
    context.entities.Mix.update({
      where: { id: mixId },
      data: { upvoteCount: { increment: 1 } },
    }),
  ]);

  return {
    upvoted: true,
    upvoteCount: updatedMix.upvoteCount,
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
              upvotes: {
                where: { userId },
                select: { id: true },
                take: 1,
              },
            }
          : {}),
      },
      orderBy: [{ upvoteCount: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return mixes.map((mix) => {
      const { upvotes, ...rest } = mix as typeof mix & {
        upvotes?: { id: string }[];
      };
      return {
        ...rest,
        periodUpvoteCount: rest.upvoteCount,
        hasUpvoted: (upvotes?.length ?? 0) > 0,
      };
    });
  }

  const grouped = await prisma.mixUpvote.groupBy({
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
            upvotes: {
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

    const { upvotes, ...rest } = mix as typeof mix & {
      upvotes?: { id: string }[];
    };

    return [
      {
        ...rest,
        periodUpvoteCount: countByMixId.get(mixId) ?? 0,
        hasUpvoted: (upvotes?.length ?? 0) > 0,
      },
    ];
  });
};
