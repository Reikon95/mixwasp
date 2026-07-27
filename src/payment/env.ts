import * as z from "zod";

// Plan IDs are only needed when users hit checkout. Default empty so
// deploy can boot before payments are fully configured.
export const paymentPlansSchema = z.object({
  PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID: z.string().default(""),
  PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID: z.string().default(""),
  PAYMENTS_CREDITS_10_PLAN_ID: z.string().default(""),
});
