import { HttpError } from "wasp/server";
import type { MiddlewareConfigFn } from "wasp/server";
import type { PaymentsWebhook } from "wasp/server/api";
import type { PaymentProcessor } from "./paymentProcessor";

const PAYMENTS_DISABLED_MESSAGE =
  "Payments are temporarily disabled. Stripe will be re-enabled later.";

const disabledWebhook: PaymentsWebhook = async (_req, res) => {
  res.status(503).json({ message: PAYMENTS_DISABLED_MESSAGE });
};

const disabledWebhookMiddlewareConfigFn: MiddlewareConfigFn = (
  middlewareConfig,
) => middlewareConfig;

/**
 * No-op payment processor so the server can boot without Stripe keys.
 * Swap back to `stripePaymentProcessor` in `paymentProcessor.ts` when ready.
 */
export const disabledPaymentProcessor: PaymentProcessor = {
  id: "stripe",
  createCheckoutSession: async () => {
    throw new HttpError(503, PAYMENTS_DISABLED_MESSAGE);
  },
  fetchCustomerPortalUrl: async () => null,
  webhook: disabledWebhook,
  webhookMiddlewareConfigFn: disabledWebhookMiddlewareConfigFn,
  fetchTotalRevenue: async () => 0,
};
