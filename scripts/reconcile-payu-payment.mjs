// One-time, server-verified recovery of an existing PayU payment.
// Usage: node --env-file=.env.local scripts/reconcile-payu-payment.mjs <txnid>
// Never expose this script as a public endpoint. Do not print credentials.
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const txnid = process.argv[2];
const fail = (message) => { throw new Error(message); };
try {
  if (!txnid || !/^SMH-[A-Za-z0-9-]{8,100}$/.test(txnid)) fail("Invalid SEOMETRICHUB transaction ID");
  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_MERCHANT_SALT;
  const base = process.env.PAYU_BASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !salt || !base || !supabaseUrl || !serviceKey) fail("Missing server environment configuration");
  const origin = new URL(base).origin;
  if (!["https://test.payu.in", "https://secure.payu.in"].includes(origin)) fail("Invalid PayU endpoint");
  const db = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: order, error: orderError } = await db.from("payment_transactions")
    .select("txnid,user_id,plan_id,provider,status,amount,currency,mihpayid").eq("txnid", txnid).single();
  if (orderError || !order) fail("Original payment order not found");
  if (order.provider !== "payu" || order.currency !== "INR" || !["pending","success"].includes(order.status)) fail("Order not eligible for recovery");
  const expectedAmount = Number(order.amount);
  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0 || !order.user_id || !order.plan_id) fail("Invalid original order");
  const { data: plan, error: planError } = await db.from("plans")
    .select("id,code,name,is_active,duration_months").eq("id", order.plan_id).single();
  if (planError || !plan || !plan.is_active || !Number.isInteger(Number(plan.duration_months)) || Number(plan.duration_months) <= 0) fail("Plan unavailable or invalid");
  const command = "verify_payment";
  const hash = createHash("sha512").update(`${key}|${command}|${txnid}|${salt}`).digest("hex");
  const body = new URLSearchParams({ key, command, var1: txnid, hash });
  const response = await fetch(`${origin}/merchant/postservice?form=2`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body, signal: AbortSignal.timeout(15000), cache: "no-store"
  });
  if (!response.ok) fail(`PayU verification HTTP ${response.status}`);
  const data = await response.json();
  const details = data?.transaction_details?.[txnid];
  if (!details || typeof details !== "object" || Array.isArray(details)) fail("PayU transaction not found");
  const mihpayid = String(details.mihpayid ?? "");
  const paidAmount = Number(details.amt ?? details.amount);
  if (details.status?.toLowerCase() !== "success" ||
      (details.txnid && details.txnid !== txnid) ||
      !mihpayid || !Number.isFinite(paidAmount) ||
      Math.abs(paidAmount - expectedAmount) > 0.01 ||
      (order.mihpayid && String(order.mihpayid) !== mihpayid)) fail("PayU verification failed: payment details mismatch");
  const productinfo = `SEOMETRICHUB ${plan.name}`;
  console.log("Verified directly with PayU:", { txnid, environment: origin === "https://test.payu.in" ? "sandbox" : "production", amount: paidAmount, status: "success" });
  const { data: result, error } = await db.rpc("finalize_payu_payment", {
    p_txnid: txnid, p_mihpayid: mihpayid, p_user_id: order.user_id,
    p_plan_id: plan.id, p_plan_code: plan.code, p_amount: paidAmount, p_productinfo: productinfo
  });
  if (error) fail(`Finalization RPC failed: ${error.code ?? "unknown"}`);
  if (!["success", "already_success"].includes(result)) fail(`Finalization rejected: ${String(result)}`);
  console.log("Finalization:", result);
  const { data: updated, error: updatedError } = await db.from("payment_transactions")
    .select("status,amount,currency,mihpayid").eq("txnid", txnid).single();
  if (updatedError || updated?.status !== "success" || String(updated.mihpayid) !== mihpayid) fail("Finalization verification failed");
  console.log("Database payment status:", updated.status);
  console.log("Subscription update performed by finalize_payu_payment RPC.");
} catch (error) {
  console.error("Recovery stopped:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
}
