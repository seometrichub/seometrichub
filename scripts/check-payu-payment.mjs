// Read-only PayU verification. Run with: node --env-file=.env.local scripts/check-payu-payment.mjs <txnid>
// Never prints merchant credentials or the full provider response.
import { createHash } from "node:crypto";

const txnid = process.argv[2];
if (!txnid || !/^[A-Za-z0-9_-]{6,100}$/.test(txnid)) {
  console.error("Usage: node --env-file=.env.local scripts/check-payu-payment.mjs <txnid>");
  process.exitCode = 1;
} else {
  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_MERCHANT_SALT;
  const baseUrl = process.env.PAYU_BASE_URL;
  let origin;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    // Invalid or absent URL; reject below.
  }

  if (!key || !salt || !["https://test.payu.in", "https://secure.payu.in"].includes(origin)) {
    console.error("PayU configuration missing or PAYU_BASE_URL is not an approved HTTPS host.");
    process.exitCode = 1;
  } else {
    const command = "verify_payment";
    const hash = createHash("sha512").update(`${key}|${command}|${txnid}|${salt}`).digest("hex");
    const payload = new URLSearchParams({ key, command, var1: txnid, hash });
    try {
      const response = await fetch(`${origin}/merchant/postservice?form=2`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload,
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      if (!response.ok) {
        console.error(`PayU verification HTTP status: ${response.status}`);
        process.exitCode = 1;
      } else {
        const data = await response.json();
        const details = data?.transaction_details?.[txnid];
        const status = typeof details?.status === "string" ? details.status : "not_found_or_unavailable";
        console.log("PayU environment:", origin === "https://test.payu.in" ? "sandbox" : "production");
        console.log("PayU transaction status:", status);
        console.log("PayU response status:", String(data?.status ?? "unknown"));
        console.log("PayU response message:", String(data?.msg ?? "not provided").slice(0, 200));
        console.log("PayU payment ID present:", Boolean(details?.mihpayid));
        console.log("PayU amount:", details?.amt ?? details?.amount ?? "not provided");
        console.log("This script does not change database records or subscriptions.");
      }
    } catch (error) {
      console.error("PayU verification request failed:", error instanceof Error ? error.message : "unknown error");
      process.exitCode = 1;
    }
  }
}
