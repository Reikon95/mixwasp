import { type EmailSender } from "@wasp.sh/spec";

export const emailSender: EmailSender = {
  provider: "Resend",
  defaultFrom: {
    name: "MixWasp",
    email: "noreply@mixwasp.com",
  },
};
