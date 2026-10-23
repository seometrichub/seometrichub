
import "server-only";
import { createHash } from "node:crypto";

type PayUVerification = {
  verified: boolean;
  reason: string;
};

export async function verifyPayUPayment(
  txnid: string,
  expectedAmount: number,
  expectedMihpayid: string,
): Promise<PayUVerification> {
  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_MERCHANT_SALT;
  const baseUrl = process.env.PAYU_BASE_URL;

  if (!key || !salt || !baseUrl) {
    return { verified: false, reason: "config_missing" };
  }

  if (
    !txnid ||
    !expectedMihpayid ||
    !Number.isFinite(expectedAmount) ||
    expectedAmount <= 0
  ) {
    return { verified: false, reason: "invalid_input" };
  }

  let origin: string;
  try {
    const endpoint = new URL(baseUrl);
    if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
      return { verified: false, reason: "invalid_endpoint" };
    }
    origin = endpoint.origin;
  } catch {
    return { verified: false, reason: "invalid_endpoint" };
  }

  if (
    origin !== "https://test.payu.in" &&
    origin !== "https://secure.payu.in"
  ) {
    return { verified: false, reason: "invalid_endpoint" };
  }

  // Independent fail-closed protection for the server-to-server verification path.
  // A staging build must never query PayU's live verification endpoint.
  if (
    (process.env.VERCEL_GIT_COMMIT_REF === "backup/local-payu-work-20261018" ||
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") === "https://staging.seometrichub.com") &&
    origin !== "https://test.payu.in"
  ) {
    return { verified: false, reason: "unsafe_staging_endpoint" };
  }

  const command = "verify_payment";

  const hash = createHash("sha512")
    .update(`${key}|${command}|${txnid}|${salt}`)
    .digest("hex");

  const body = new URLSearchParams({
    key,
    command,
    var1: txnid,
    hash,
  });

  try {
    const response = await fetch(
      `${origin}/merchant/postservice?form=2`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      return {
        verified: false,
        reason: "payu_http_error",
      };
    }

    const data: unknown = await response.json();

    if (
      typeof data !== "object" ||
      data === null ||
      !("transaction_details" in data)
    ) {
      return {
        verified: false,
        reason: "invalid_payu_response",
      };
    }

    const details = (
      data as {
        transaction_details?: Record<
          string,
          {
            status?: string;
            txnid?: string;
            mihpayid?: string | number;
            amt?: string | number;
            amount?: string | number;
          }
        >;
      }
    ).transaction_details?.[txnid];

   if (
  !details ||
  typeof details !== "object" ||
  Array.isArray(details)
) {
      return {
        verified: false,
        reason: "transaction_not_found",
      };
    }

    const amount = Number(
      details.amt ?? details.amount,
    );

    const verified =
      details.status?.toLowerCase() === "success" &&
      (!details.txnid || details.txnid === txnid) &&
      String(details.mihpayid ?? "") ===
        expectedMihpayid &&
      Number.isFinite(amount) &&
      Math.abs(amount - expectedAmount) <= 0.01;

    return {
      verified,
      reason: verified ? "verified" : "payment_mismatch",
    };
  } catch {
    return {
      verified: false,
      reason: "verification_request_failed",
    };
  }
}
