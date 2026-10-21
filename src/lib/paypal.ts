import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { products } from "@/data/products";

const subscriptionTierSchema = z.enum(["none", "silver", "gold", "platinum"]);
const deliveryTypeSchema = z.enum(["courier", "pickup"]);

const checkoutInputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1),
  subscriptionTier: subscriptionTierSchema,
  deliveryType: deliveryTypeSchema,
});

const captureInputSchema = z.object({
  orderId: z.string().min(1),
});

type RuntimeEnv = Record<string, string | undefined>;
type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;
type DeliveryType = z.infer<typeof deliveryTypeSchema>;
type CheckoutInput = z.infer<typeof checkoutInputSchema>;
type CaptureInput = z.infer<typeof captureInputSchema>;

type PayPalAccessTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

type PayPalOrderResponse = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: {
          currency_code?: string;
          value?: string;
        };
      }>;
    };
  }>;
};

function getRuntimeEnv(): RuntimeEnv {
  const runtimeEnv = (globalThis as { __AGAS_ENV__?: RuntimeEnv }).__AGAS_ENV__ ?? {};
  const processEnv = (globalThis as { process?: { env?: RuntimeEnv } }).process?.env ?? {};
  const viteEnv = import.meta.env as RuntimeEnv;

  return { ...viteEnv, ...processEnv, ...runtimeEnv };
}

function getEnvValue(name: string): string {
  const value = getRuntimeEnv()[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function getOptionalEnvValue(name: string): string | undefined {
  return getRuntimeEnv()[name];
}

function getPayPalBaseUrl(): string {
  const mode = getOptionalEnvValue("PAYPAL_MODE") ?? "sandbox";

  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function getPayPalCurrency(): string {
  return (
    getOptionalEnvValue("PAYPAL_CURRENCY") ??
    getOptionalEnvValue("VITE_PAYPAL_CURRENCY") ??
    "USD"
  ).toUpperCase();
}

function getKztPerPayPalCurrency(): number {
  const rawRate =
    getOptionalEnvValue("PAYPAL_KZT_PER_UNIT") ??
    getOptionalEnvValue("VITE_PAYPAL_KZT_PER_UNIT") ??
    "450";
  const rate = Number(rawRate);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("PAYPAL_KZT_PER_UNIT must be a positive number");
  }

  return rate;
}

function calculateOrderTotal(
  input: { items: { productId: string; quantity: number }[] },
  tier: SubscriptionTier,
  deliveryType: DeliveryType,
) {
  const lines = input.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);

    if (!product) {
      throw new Error(`Unknown product: ${item.productId}`);
    }

    if (!product.inStock) {
      throw new Error(`Product is out of stock: ${product.name}`);
    }

    return { product, item };
  });

  const subtotal = lines.reduce((acc, l) => acc + l.product.price * l.item.quantity, 0);
  const guestVat = subtotal * 0.16;
  const guestDelivery = deliveryType === "courier" ? subtotal * 0.1 : 0;

  let discountPercent = 0;
  let hasFreeDelivery = false;

  if (tier === "silver") {
    discountPercent = 0.1;
  } else if (tier === "gold") {
    discountPercent = 0.15;
    hasFreeDelivery = true;
  } else if (tier === "platinum") {
    discountPercent = 0.2;
    hasFreeDelivery = true;
  }

  const subscriberDiscount = subtotal * discountPercent;
  const finalSubtotal = subtotal - subscriberDiscount;
  const finalVat = finalSubtotal * 0.16;
  const finalDelivery = hasFreeDelivery || deliveryType === "pickup" ? 0 : finalSubtotal * 0.1;
  const finalTotal = finalSubtotal + finalVat + finalDelivery;
  const total = tier === "none" ? subtotal + guestVat + guestDelivery : finalTotal;

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Invalid order total");
  }

  return total;
}

function toPayPalAmountValue(kztAmount: number): string {
  const currency = getPayPalCurrency();
  const converted = currency === "KZT" ? kztAmount : kztAmount / getKztPerPayPalCurrency();
  const normalized = Math.max(0.01, Math.round(converted * 100) / 100);

  return normalized.toFixed(2);
}

async function readPayPalJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const details = payload && typeof payload === "object" ? JSON.stringify(payload) : text;
    throw new Error(`PayPal request failed (${response.status}): ${details}`);
  }

  return payload as T;
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = getEnvValue("PAYPAL_CLIENT_ID");
  const clientSecret = getEnvValue("PAYPAL_CLIENT_SECRET");
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const token = await readPayPalJson<PayPalAccessTokenResponse>(response);

  if (!token.access_token) {
    throw new Error("PayPal did not return an access token");
  }

  return token.access_token;
}

export const createPaypalOrder = createServerFn({ method: "POST" })
  .inputValidator((input: CheckoutInput) => checkoutInputSchema.parse(input))
  .handler(async ({ data }) => {
    const accessToken = await getPayPalAccessToken();
    const totalKzt = calculateOrderTotal(data, data.subscriptionTier, data.deliveryType);
    const currency = getPayPalCurrency();
    const value = toPayPalAmountValue(totalKzt);

    const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value,
            },
            description: "AGAS marketplace order",
          },
        ],
      }),
    });

    const order = await readPayPalJson<PayPalOrderResponse>(response);

    if (!order.id) {
      throw new Error("PayPal did not return an order id");
    }

    return {
      id: order.id,
      status: order.status ?? "CREATED",
      amount: {
        currency,
        value,
      },
    };
  });

export const capturePaypalOrder = createServerFn({ method: "POST" })
  .inputValidator((input: CaptureInput) => captureInputSchema.parse(input))
  .handler(async ({ data }) => {
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(
      `${getPayPalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(data.orderId)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const capture = await readPayPalJson<PayPalOrderResponse>(response);
    const completedCapture = capture.purchase_units
      ?.flatMap((unit) => unit.payments?.captures ?? [])
      .find((paymentCapture) => paymentCapture.status === "COMPLETED");

    if (capture.status !== "COMPLETED" || !completedCapture?.id) {
      throw new Error(`PayPal capture was not completed. Status: ${capture.status ?? "UNKNOWN"}`);
    }

    return {
      id: capture.id ?? data.orderId,
      status: capture.status,
      captureId: completedCapture.id,
      amount: completedCapture.amount
        ? {
            currency: completedCapture.amount.currency_code ?? getPayPalCurrency(),
            value: completedCapture.amount.value ?? "0.00",
          }
        : undefined,
    };
  });
