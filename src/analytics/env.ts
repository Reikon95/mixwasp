import * as z from "zod";

export const plausibleEnvSchema = z.object({
  PLAUSIBLE_API_KEY: z.string().default(""),
  PLAUSIBLE_SITE_ID: z.string().default(""),
  PLAUSIBLE_BASE_URL: z.string().default(""),
});

export const googleAnalyticsEnvSchema = z.object({
  GOOGLE_ANALYTICS_CLIENT_EMAIL: z.string().default(""),
  GOOGLE_ANALYTICS_PRIVATE_KEY: z.string().default(""),
  GOOGLE_ANALYTICS_PROPERTY_ID: z.string().default(""),
});
