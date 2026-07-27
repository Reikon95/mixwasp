import * as z from "zod";
import { paymentPlansSchema } from "../env";

export const stripeEnvSchema = paymentPlansSchema.extend({
  STRIPE_API_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
});
