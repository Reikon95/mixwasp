import * as z from "zod";
import { paymentPlansSchema } from "../env";

export const polarEnvSchema = paymentPlansSchema.extend({
  POLAR_ORGANIZATION_ACCESS_TOKEN: z.string().default(""),
  POLAR_SANDBOX_MODE: z.string().default("true"),
  POLAR_WEBHOOK_SECRET: z.string().default(""),
});
