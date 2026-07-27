import { app, page, route } from "@wasp.sh/spec";

import { App } from "./src/client/App" with { type: "ref" };
import { NotFoundPage } from "./src/client/components/NotFoundPage" with { type: "ref" };
import { serverEnvValidationSchema } from "./src/env" with { type: "ref" };
import {
  seedAll,
  seedMockDailyStats,
  seedMockFiles,
  seedMockLogs,
  seedMockMixes,
  seedMockUsers,
} from "./src/server/scripts/dbSeeds" with { type: "ref" };

import { adminSpec } from "./src/admin/admin.wasp";
import { analyticsSpec } from "./src/analytics/analytics.wasp";
import { authConfig, authSpec } from "./src/auth/auth.wasp";
import { head } from "./src/client/head.wasp";
import { fileUploadSpec } from "./src/file-upload/file-upload.wasp";
import { mixesSpec } from "./src/mixes/mixes.wasp";
import { paymentSpec } from "./src/payment/payment.wasp";
import { emailSender } from "./src/server/emailSender.wasp";
import { userSpec } from "./src/user/user.wasp";

export default app({
  name: "OpenSaaS",
  wasp: { version: "^0.24.0" },
  title: "MixWasp",
  head,
  auth: authConfig,
  db: {
    // Run `wasp db seed` (or `wasp db seed <name>`) to populate the DB.
    // https://wasp.sh/docs/data-model/databases#seeding-the-database
    seeds: [
      seedMockUsers,
      seedMockMixes,
      seedMockFiles,
      seedMockDailyStats,
      seedMockLogs,
      seedAll,
    ],
  },
  client: {
    rootComponent: App,
  },
  server: {
    envValidationSchema: serverEnvValidationSchema,
  },
  emailSender,
  spec: [
    // Mixes rankings live at `/` via mixesSpec - product first.
    mixesSpec,
    authSpec,
    userSpec,
    paymentSpec,
    fileUploadSpec,
    analyticsSpec,
    adminSpec,
    route("NotFoundRoute", "*", page(NotFoundPage)),
  ],
});
