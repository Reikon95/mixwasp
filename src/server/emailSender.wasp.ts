import { type EmailSender } from "@wasp.sh/spec";

// Use "Dummy" for local development: verification emails are printed to the
// server terminal (Wasp does NOT auto-fallback to Dummy when Resend fails).
// Switch to "Resend" for production and set RESEND_API_KEY in `.env.server`.
export const emailSender: EmailSender = {
  provider: "Resend", // if building locally, use "Dummy"
  defaultFrom: {
    name: "MixWasp",
    email: "noreply@mixwasp.com",
  },
};
