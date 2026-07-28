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
    title: "Warehouse Soft Open",
    artist: { name: "Nora Vale" },
    link: "https://soundcloud.com/",
    promoter: "North Dock",
    description: "Rolling house for a slow-build Friday.",
    genres: [{ name: "House" }],
    tags: [{ name: "Warmup" }, { name: "Live" }],
  },
  {
    title: "Chrome Stairs",
    artist: { name: "Kite Frequency" },
    link: "https://soundcloud.com/",
    promoter: "Circuit Room",
    description: "Tight techno with a late-night edge.",
    genres: [{ name: "Techno" }],
    tags: [{ name: "Peak Time" }],
  },
  {
    title: "Salt Air Transmission",
    artist: { name: "Mira Solis" },
    link: "https://soundcloud.com/",
    description: "Coastal disco edits into deep house.",
    genres: [{ name: "Disco" }, { name: "House" }],
    tags: [{ name: "Radio" }, { name: "Warmup" }],
  },
  {
    title: "Low Pressure System",
    artist: { name: "Juniper Bass" },
    link: "https://soundcloud.com/",
    promoter: "Basin",
    description: "Half-time drum & bass with heavy subs.",
    genres: [{ name: "Drum & Bass" }],
    tags: [{ name: "Peak Time" }, { name: "Live" }],
  },
  {
    title: "Afterglow Corridor",
    artist: { name: "Echo Marlowe" },
    link: "https://soundcloud.com/",
    description: "Ambient drift for the walk home.",
    genres: [{ name: "Ambient" }],
    tags: [{ name: "Sunrise" }],
  },
  {
    title: "Second Wind",
    artist: { name: "Riven Coast" },
    link: "https://soundcloud.com/",
    promoter: "Harbor Line",
    description: "Peak-time house with a live vocal cut.",
    genres: [{ name: "House" }],
    tags: [{ name: "Peak Time" }, { name: "Live" }],
  },
  {
    title: "Night Bus Sketch",
    artist: { name: "Nora Vale" },
    link: "https://soundcloud.com/",
    description: "Unreleased techno tools and closed loops.",
    genres: [{ name: "Techno" }],
    tags: [{ name: "Radio" }],
  },
  {
    title: "Green Room Heat",
    artist: { name: "Kite Frequency" },
    link: "https://soundcloud.com/",
    promoter: "Circuit Room",
    description: "Drum & bass warm-up before the headliner.",
    genres: [{ name: "Drum & Bass" }],
    tags: [{ name: "Warmup" }],
  },
  {
    title: "Paradise City 2026",
    artist: { name: "Interplanetary Criminal" },
    link: "https://www.youtube.com/watch?v=rseeyi0pFq8",
    promoter: "Paradise City Festival",
    description: "UK garage and breakbeat energy from Paradise City 2026.",
    genres: [{ name: "House" }, { name: "Disco" }],
    tags: [{ name: "Live" }, { name: "Peak Time" }],
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
          genres: {
            connect: seed.genres.map((genre) => ({ name: genre.name })),
          },
          tags: {
            connect: seed.tags.map((tag) => ({ name: tag.name })),
          },
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
    { mixIndex: 7, voterIndex: 7, at: daysAgo(20) },
    { mixIndex: 7, voterIndex: 0, at: daysAgo(22) },
    { mixIndex: 8, voterIndex: 1, at: hoursAgo(4) },
    { mixIndex: 8, voterIndex: 3, at: hoursAgo(6) },
    { mixIndex: 8, voterIndex: 5, at: daysAgo(1) },
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
