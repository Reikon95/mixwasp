import type { PrismaClient } from "@prisma/client";

/** Seed shape aligned with Mix + Artist + Genre[] + Tag[] in schema.prisma */
type DemoMixSeed = {
  title: string;
  link: string;
  promoter?: string;
  description?: string;
  artist: { name: string };
  genres: { name: string }[];
  tags: { name: string }[];
};

const DEMO_MIXES: DemoMixSeed[] = [
  {
    title:
      "Radio 1's Essential Mix with Barry Can't Swim at The Warehouse Project",
    artist: { name: "Barry Can't Swim" },
    link: "https://www.youtube.com/watch?v=F2Pw1lWWtl8",
    promoter: "Radio 1",
    genres: [{ name: "House" }, { name: "Disco" }],
    tags: [{ name: "live" }],
  },
  {
    title: "Barry Can't Swim b2b salute - Live at Lost Sundays (Sydney) 2024",
    artist: { name: "Barry Can't Swim" },
    link: "https://www.youtube.com/watch?v=A_MHvl6_7-Y",
    promoter: "Lost Sundays",
    genres: [{ name: "House" }],
    tags: [],
  },
  {
    title:
      "Interplanetary Criminal at Paradise City 2026: Forest Stage Closing Set",
    artist: { name: "Interplanetary Criminal" },
    link: "https://www.youtube.com/watch?v=rseeyi0pFq8",
    promoter: "Paradise City 2026",
    genres: [{ name: "House" }],
    tags: [],
  },
  {
    title: "Chris Stussy @ Paradise City, Brussels 2025",
    artist: { name: "Chris Stussy" },
    link: "https://www.youtube.com/watch?v=-iiaxD8QngA",
    genres: [{ name: "House" }],
    tags: [{ name: "live" }],
  },
  {
    title: "Interplanetary Criminal | EDC Las Vegas 2026",
    artist: { name: "Interplanetary Criminal" },
    link: "https://www.youtube.com/watch?v=V6EXDSElxtM",
    genres: [{ name: "House" }],
    tags: [{ name: "live" }],
  },
  {
    title: "Silva Bumpa | R360 Live From Addict, Prague",
    artist: { name: "Silva Bumpa" },
    link: "https://www.youtube.com/watch?v=5AnQX_9Ce1U",
    genres: [{ name: "House" }],
    tags: [{ name: "live" }],
  },
  {
    title: "Flava D | Boiler Room: Sheffield",
    artist: { name: "Flava D" },
    link: "https://www.youtube.com/watch?v=KmRqOaS_6FI",
    promoter: "Boiler Room",
    genres: [{ name: "Dubstep" }, { name: "Bass" }, { name: "Garage" }],
    tags: [{ name: "live" }],
  },
  {
    title: "southstar | Boiler Room: Belfast",
    artist: { name: "southstar" },
    link: "https://www.youtube.com/watch?v=GoEYxQadWfY",
    promoter: "Boiler Room",
    genres: [{ name: "House" }, { name: "Techno" }],
    tags: [{ name: "live" }],
  },
];

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Seeds demo mixes (and staggered favourites) when the Mix table is empty.
 * Artist, Genre, and Tag names are @unique — upserted once up front, then mixes
 * connect by name. Safe to call repeatedly - no-ops once mixes exist.
 */
export async function ensureDemoMixesSeeded(
  prisma: PrismaClient,
): Promise<{ seeded: boolean; mixCount: number }> {
  const existingCount = await prisma.mix.count();
  if (existingCount > 0) {
    return { seeded: false, mixCount: existingCount };
  }

  // Upsert unique artists/genres/tags first so parallel mix creates can't race.
  const artistNames = [
    ...new Set(DEMO_MIXES.map((mix) => mix.artist.name)),
  ];
  const genreNames = [
    ...new Set(DEMO_MIXES.flatMap((mix) => mix.genres.map((g) => g.name))),
  ];
  const tagNames = [
    ...new Set(DEMO_MIXES.flatMap((mix) => mix.tags.map((t) => t.name))),
  ];

  for (const name of artistNames) {
    await prisma.artist.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  for (const name of genreNames) {
    await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const mixes = await Promise.all(
    DEMO_MIXES.map(async (seed) => {
      return prisma.mix.create({
        data: {
          title: seed.title,
          link: seed.link,
          promoter: seed.promoter,
          description: seed.description,
          artist: {
            connect: { name: seed.artist.name },
          },
          genres:
            seed.genres.length > 0
              ? {
                  connect: seed.genres.map((genre) => ({ name: genre.name })),
                }
              : undefined,
          tags:
            seed.tags.length > 0
              ? {
                  connect: seed.tags.map((tag) => ({ name: tag.name })),
                }
              : undefined,
        },
      });
    }),
  );

  // Dedicated users so period leaderboards have data without needing real logins.
  const voters = await Promise.all(
    Array.from({ length: 8 }, async (_, i) => {
      const email = `demo-voter-${i}@yourtopmixes.local`;
      const username = `demo_voter_${i}`;
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });
      if (existing) {
        return existing;
      }
      return prisma.user.create({
        data: { email, username },
      });
    }),
  );

  // Favourite schedules: some today, some this week, some earlier this month.
  const favouritePlan: { mixIndex: number; voterIndex: number; at: Date }[] = [
    { mixIndex: 0, voterIndex: 0, at: hoursAgo(1) },
    { mixIndex: 0, voterIndex: 1, at: hoursAgo(3) },
    { mixIndex: 1, voterIndex: 2, at: hoursAgo(2) },
    { mixIndex: 1, voterIndex: 3, at: hoursAgo(5) },
    { mixIndex: 1, voterIndex: 4, at: hoursAgo(8) },
    { mixIndex: 2, voterIndex: 0, at: daysAgo(2) },
    { mixIndex: 2, voterIndex: 5, at: daysAgo(3) },
    { mixIndex: 3, voterIndex: 1, at: daysAgo(4) },
    { mixIndex: 3, voterIndex: 2, at: daysAgo(5) },
    { mixIndex: 3, voterIndex: 6, at: daysAgo(6) },
    { mixIndex: 4, voterIndex: 3, at: daysAgo(10) },
    { mixIndex: 5, voterIndex: 4, at: daysAgo(12) },
    { mixIndex: 5, voterIndex: 5, at: daysAgo(14) },
    { mixIndex: 5, voterIndex: 7, at: daysAgo(15) },
    { mixIndex: 6, voterIndex: 6, at: daysAgo(18) },
    { mixIndex: 6, voterIndex: 0, at: hoursAgo(6) },
    { mixIndex: 7, voterIndex: 7, at: daysAgo(20) },
    { mixIndex: 7, voterIndex: 0, at: daysAgo(1) },
    { mixIndex: 7, voterIndex: 3, at: hoursAgo(4) },
  ];

  for (const favourite of favouritePlan) {
    const mix = mixes[favourite.mixIndex];
    const voter = voters[favourite.voterIndex];
    if (!mix || !voter) {
      continue;
    }

    await prisma.mixFavourite.create({
      data: {
        userId: voter.id,
        mixId: mix.id,
        createdAt: favourite.at,
      },
    });
  }

  const counts = await prisma.mixFavourite.groupBy({
    by: ["mixId"],
    _count: { mixId: true },
  });

  await Promise.all(
    counts.map((row) =>
      prisma.mix.update({
        where: { id: row.mixId },
        data: { favouriteCount: row._count.mixId },
      }),
    ),
  );

  return { seeded: true, mixCount: mixes.length };
}
