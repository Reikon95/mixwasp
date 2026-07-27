import * as z from "zod";
import { paymentPlansSchema } from "../env";

export const lemonSqueezyEnvSchema = paymentPlansSchema.extend({
  LEMONSQUEEZY_API_KEY: z.string().default(""),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().default(""),
  LEMONSQUEEZY_STORE_ID: z.string().default(""),
});
