import type { PrismaClient } from "@prisma/client";

const DEMO_ARTISTS = [
  "Nora Vale",
  "Kite Frequency",
  "Mira Solis",
  "Juniper Bass",
  "Echo Marlowe",
  "Riven Coast",
] as const;

const DEMO_GENRES = [
  "House",
  "Techno",
  "Drum & Bass",
  "Ambient",
  "Disco",
] as const;

const DEMO_TAGS = ["Live", "Warmup", "Peak Time", "Sunrise", "Radio"] as const;

type DemoMixSeed = {
  title: string;
  artist: (typeof DEMO_ARTISTS)[number];
  link: string;
  promoter?: string;
  description: string;
  genres: (typeof DEMO_GENRES)[number][];
  tags: (typeof DEMO_TAGS)[number][];
};

const DEMO_MIXES: DemoMixSeed[] = [
  {
    title: "Warehouse Soft Open",
    artist: "Nora Vale",
    link: "https://soundcloud.com/",
    promoter: "North Dock",
    description: "Rolling house for a slow-build Friday.",
    genres: ["House"],
    tags: ["Warmup", "Live"],
  },
  {
    title: "Chrome Stairs",
    artist: "Kite Frequency",
    link: "https://soundcloud.com/",
    promoter: "Circuit Room",
    description: "Tight techno with a late-night edge.",
    genres: ["Techno"],
    tags: ["Peak Time"],
  },
  {
    title: "Salt Air Transmission",
    artist: "Mira Solis",
    link: "https://soundcloud.com/",
    description: "Coastal disco edits into deep house.",
    genres: ["Disco", "House"],
    tags: ["Radio", "Warmup"],
  },
  {
    title: "Low Pressure System",
    artist: "Juniper Bass",
    link: "https://soundcloud.com/",
    promoter: "Basin",
    description: "Half-time drum & bass with heavy subs.",
    genres: ["Drum & Bass"],
    tags: ["Peak Time", "Live"],
  },
  {
    title: "Afterglow Corridor",
    artist: "Echo Marlowe",
    link: "https://soundcloud.com/",
    description: "Ambient drift for the walk home.",
    genres: ["Ambient"],
    tags: ["Sunrise"],
  },
  {
    title: "Second Wind",
    artist: "Riven Coast",
    link: "https://soundcloud.com/",
    promoter: "Harbor Line",
    description: "Peak-time house with a live vocal cut.",
    genres: ["House"],
    tags: ["Peak Time", "Live"],
  },
  {
    title: "Night Bus Sketch",
    artist: "Nora Vale",
    link: "https://soundcloud.com/",
    description: "Unreleased techno tools and closed loops.",
    genres: ["Techno"],
    tags: ["Radio"],
  },
  {
    title: "Green Room Heat",
    artist: "Kite Frequency",
    link: "https://soundcloud.com/",
    promoter: "Circuit Room",
    description: "Drum & bass warm-up before the headliner.",
    genres: ["Drum & Bass"],
    tags: ["Warmup"],
  },
];

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Seeds demo mixes (and staggered upvotes) when the Mix table is empty.
 * Safe to call repeatedly — no-ops once mixes exist.
 */
export async function ensureDemoMixesSeeded(
  prisma: PrismaClient,
): Promise<{ seeded: boolean; mixCount: number }> {
  const existingCount = await prisma.mix.count();
  if (existingCount > 0) {
    return { seeded: false, mixCount: existingCount };
  }

  const artists = await Promise.all(
    DEMO_ARTISTS.map((name) => prisma.artist.create({ data: { name } })),
  );
  const artistByName = new Map(artists.map((a) => [a.name, a]));

  const genres = await Promise.all(
    DEMO_GENRES.map((name) => prisma.genre.create({ data: { name } })),
  );
  const genreByName = new Map(genres.map((g) => [g.name, g]));

  const tags = await Promise.all(
    DEMO_TAGS.map((name) => prisma.tag.create({ data: { name } })),
  );
  const tagByName = new Map(tags.map((t) => [t.name, t]));

  const mixes = await Promise.all(
    DEMO_MIXES.map((mix) => {
      const artist = artistByName.get(mix.artist);
      if (!artist) {
        throw new Error(`Missing demo artist: ${mix.artist}`);
      }

      return prisma.mix.create({
        data: {
          title: mix.title,
          link: mix.link,
          promoter: mix.promoter,
          description: mix.description,
          artistId: artist.id,
          genres: {
            connect: mix.genres.map((name) => {
              const genre = genreByName.get(name);
              if (!genre) {
                throw new Error(`Missing demo genre: ${name}`);
              }
              return { id: genre.id };
            }),
          },
          tags: {
            connect: mix.tags.map((name) => {
              const tag = tagByName.get(name);
              if (!tag) {
                throw new Error(`Missing demo tag: ${name}`);
              }
              return { id: tag.id };
            }),
          },
        },
      });
    }),
  );

  // Dedicated voters so period leaderboards have data without needing real logins.
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

  // Vote schedules: some today, some this week, some earlier this month.
  const votePlan: { mixIndex: number; voterIndex: number; at: Date }[] = [
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
  ];

  for (const vote of votePlan) {
    const mix = mixes[vote.mixIndex];
    const voter = voters[vote.voterIndex];
    if (!mix || !voter) {
      continue;
    }

    await prisma.mixUpvote.create({
      data: {
        userId: voter.id,
        mixId: mix.id,
        createdAt: vote.at,
      },
    });
  }

  const counts = await prisma.mixUpvote.groupBy({
    by: ["mixId"],
    _count: { mixId: true },
  });

  await Promise.all(
    counts.map((row) =>
      prisma.mix.update({
        where: { id: row.mixId },
        data: { upvoteCount: row._count.mixId },
      }),
    ),
  );

  return { seeded: true, mixCount: mixes.length };
}
