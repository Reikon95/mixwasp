import { faker } from "@faker-js/faker";
import type { PrismaClient } from "@prisma/client";
import type { DbSeedFn } from "wasp/server";
import { type User } from "wasp/entities";
import {
  getSubscriptionPaymentPlanIds,
  SubscriptionStatus,
} from "../../payment/plans";
import { ALLOWED_FILE_TYPES } from "../../file-upload/validation";
import { ensureDemoMixesSeeded } from "../../mixes/seedDemoMixes";

type MockUserData = Omit<User, "id">;

/**
 * This function, which we've imported in `app.db.seeds` in the `main.wasp` file,
 * seeds the database with mock users via the `wasp db seed` command.
 * For more info see: https://wasp.sh/docs/data-model/backends#seeding-the-database
 */
export const seedMockUsers: DbSeedFn = async (prismaClient) => {
  await Promise.all(
    generateMockUsersData(50).map((data) => prismaClient.user.create({ data })),
  );
  console.log("Seeded 50 mock users.");
};

/**
 * Seeds artists, genres, tags, mixes, and staggered MixFavourites.
 * No-ops if mixes already exist (same logic as the /mixes demo seed).
 */
export const seedMockMixes: DbSeedFn = async (prismaClient) => {
  const result = await ensureDemoMixesSeeded(prismaClient);
  if (result.seeded) {
    console.log(
      `Seeded ${result.mixCount} mixes (plus artists, genres, tags, and favourites).`,
    );
  } else {
    console.log(
      `Mixes already present (${result.mixCount}); skipped mix seed.`,
    );
  }
};

/**
 * Seeds File rows for existing users (creates a few users if none exist).
 * S3 keys are fake placeholders for local/dev UI - they are not uploaded to S3.
 */
export const seedMockFiles: DbSeedFn = async (prismaClient) => {
  let users = await prismaClient.user.findMany({ take: 10 });
  if (users.length === 0) {
    users = await Promise.all(
      generateMockUsersData(5).map((data) =>
        prismaClient.user.create({ data }),
      ),
    );
    console.log("No users found; created 5 users for file seeding.");
  }

  const files = users.flatMap((user) => {
    const count = faker.number.int({ min: 1, max: 3 });
    return Array.from({ length: count }, () => {
      const fileType = faker.helpers.arrayElement(ALLOWED_FILE_TYPES);
      const extension = extensionForMime(fileType);
      const fileName = `${faker.system.commonFileName(extension)}`;
      return {
        name: fileName,
        type: fileType,
        s3Key: `seed/${user.id}/${faker.string.uuid()}-${fileName}`,
        userId: user.id,
        createdAt: faker.date.recent({ days: 60 }),
      };
    });
  });

  await prismaClient.file.createMany({ data: files });
  console.log(`Seeded ${files.length} mock files.`);
};

/**
 * Seeds DailyStats for the last 14 days, each with PageViewSource rows.
 */
export const seedMockDailyStats: DbSeedFn = async (prismaClient) => {
  const sourceNames = ["google", "twitter", "direct", "newsletter", "reddit"];
  let createdDays = 0;

  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const date = startOfUtcDay(daysAgo);
    const existing = await prismaClient.dailyStats.findUnique({
      where: { date },
    });
    if (existing) {
      continue;
    }

    const userCount = faker.number.int({ min: 20, max: 200 });
    const paidUserCount = faker.number.int({
      min: 0,
      max: Math.floor(userCount / 3),
    });
    const totalRevenue = faker.number.float({
      min: 0,
      max: 5000,
      precision: 0.01,
    });

    const dailyStats = await prismaClient.dailyStats.create({
      data: {
        date,
        totalViews: faker.number.int({ min: 100, max: 5000 }),
        prevDayViewsChangePercent: faker.number
          .float({ min: -40, max: 60, precision: 0.1 })
          .toString(),
        userCount,
        paidUserCount,
        userDelta: faker.number.int({ min: -5, max: 25 }),
        paidUserDelta: faker.number.int({ min: -2, max: 8 }),
        totalRevenue,
        totalProfit: Number((totalRevenue * 0.7).toFixed(2)),
      },
    });

    const sourcesForDay = faker.helpers.arrayElements(sourceNames, {
      min: 2,
      max: sourceNames.length,
    });

    await prismaClient.pageViewSource.createMany({
      data: sourcesForDay.map((name) => ({
        name,
        date,
        dailyStatsId: dailyStats.id,
        visitors: faker.number.int({ min: 10, max: 800 }),
      })),
    });

    createdDays += 1;
  }

  console.log(
    createdDays > 0
      ? `Seeded ${createdDays} days of daily stats (with page-view sources).`
      : "Daily stats already present for the last 14 days; skipped.",
  );
};

/**
 * Seeds application Logs rows used by the admin/analytics tooling.
 */
export const seedMockLogs: DbSeedFn = async (prismaClient) => {
  const levels = ["info", "warn", "error", "job-error"] as const;
  const messages = [
    "Daily stats job completed successfully.",
    "Payment webhook received.",
    "Failed to fetch analytics provider data.",
    "User subscription status updated.",
    "S3 signed URL generated.",
    "Retrying failed background job.",
    "Rate limit approaching for analytics API.",
  ];

  const logs = Array.from({ length: 25 }, () => ({
    message: faker.helpers.arrayElement(messages),
    level: faker.helpers.arrayElement(levels),
    createdAt: faker.date.recent({ days: 30 }),
  }));

  await prismaClient.logs.createMany({ data: logs });
  console.log(`Seeded ${logs.length} mock logs.`);
};

/**
 * Runs all seeders in dependency order. Useful after `wasp db reset`.
 */
export const seedAll: DbSeedFn = async (prismaClient) => {
  await seedMockUsers(prismaClient);
  await seedMockMixes(prismaClient);
  await seedMockFiles(prismaClient);
  await seedMockDailyStats(prismaClient);
  await seedMockLogs(prismaClient);
  console.log("Finished seedAll.");
};

function generateMockUsersData(numOfUsers: number): MockUserData[] {
  return faker.helpers.multiple(generateMockUserData, { count: numOfUsers });
}

function generateMockUserData(): MockUserData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const subscriptionStatus =
    faker.helpers.arrayElement<SubscriptionStatus | null>([
      ...Object.values(SubscriptionStatus),
      null,
    ]);
  const now = new Date();
  const createdAt = faker.date.past({ refDate: now });
  const timePaid = faker.date.between({ from: createdAt, to: now });
  const credits = subscriptionStatus
    ? 0
    : faker.number.int({ min: 0, max: 10 });
  const hasUserPaidOnStripe = !!subscriptionStatus || credits > 3;
  return {
    email: faker.internet.email({ firstName, lastName }),
    username: faker.internet.userName({ firstName, lastName }),
    createdAt,
    isAdmin: false,
    credits,
    subscriptionStatus,
    lemonSqueezyCustomerPortalUrl: null,
    paymentProcessorUserId: hasUserPaidOnStripe
      ? `cus_test_${faker.string.uuid()}`
      : null,
    datePaid: hasUserPaidOnStripe
      ? faker.date.between({ from: createdAt, to: timePaid })
      : null,
    subscriptionPlan: subscriptionStatus
      ? faker.helpers.arrayElement(getSubscriptionPaymentPlanIds())
      : null,
  };
}

function startOfUtcDay(daysAgo: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
}

function extensionForMime(mime: (typeof ALLOWED_FILE_TYPES)[number]): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "application/pdf":
      return "pdf";
    case "text/*":
      return "txt";
    case "video/quicktime":
      return "mov";
    case "video/mp4":
      return "mp4";
    default:
      return "bin";
  }
}
