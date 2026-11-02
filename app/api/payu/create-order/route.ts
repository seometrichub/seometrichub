import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_PAID_PLANS = ["pro_monthly", "pro_3_months", "pro_6_months", "pro_12_months"] as const;
type PaidPlanCode = (typeof ALLOWED_PAID_PLANS)[number];
function isPaidPlanCode(value: string): value is PaidPlanCode {
  return ALLOWED_PAID_PLANS.includes(value as PaidPlanCode);
}

type PayUCreateResponse = {
  status?: number;
  message?: string;
  result?: { invoiceNumber?: string; paymentLink?: string; totalAmount?: number };
};

export async function POST(request: Request) {
  try {
    // This endpoint intentionally supports sandbox only until the full payment
    // verification/finalization flow has been validated in staging.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
    const clientId = process.env.PAYU_CLIENT_ID;
    const clientSecret = process.env.PAYU_CLIENT_SECRET;
    const merchantId = process.env.PAYU_MERCHANT_ID;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!appUrl || !clientId || !clientSecret || !merchantId || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ success: false, error: "Payment configuration is incomplete." }, { status: 503 });
    }
    if (new URL(appUrl).hostname !== "staging.seometrichub.com" ||
        (process.env.VERCEL_GIT_COMMIT_REF && process.env.VERCEL_GIT_COMMIT_REF !== "backup/local-payu-work-20261018")) {
      return NextResponse.json({ success: false, error: "Payment Links are currently enabled only on staging." }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ success: false, error: "Please sign in before starting payment." }, { status: 401 });

    const body = await request.json().catch(() => null);
    const planCode = typeof body?.planCode === "string" ? body.planCode.trim() : "";
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    if (!isPaidPlanCode(planCode)) return NextResponse.json({ success: false, error: "Invalid paid plan selected." }, { status: 400 });
    if (!firstName) return NextResponse.json({ success: false, error: "First name is required." }, { status: 400 });
    if (!/^[0-9]{10}$/.test(phone)) return NextResponse.json({ success: false, error: "A valid 10-digit phone number is required." }, { status: 400 });
    if (!user.email) return NextResponse.json({ success: false, error: "Your account needs an email address." }, { status: 400 });

    const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: plan, error: planError } = await admin.from("plans")
      .select("id, code, name, price_inr, duration_months, is_active")
      .eq("code", planCode).eq("is_active", true).single();
    if (planError || !plan) return NextResponse.json({ success: false, error: "Selected plan is unavailable." }, { status: 404 });

    const amount = Number(plan.price_inr);
    if (!Number.isSafeInteger(amount) || amount < 1) return NextResponse.json({ success: false, error: "Plan amount must be a whole number of INR." }, { status: 400 });

    const txnid = `SMH${Date.now()}${randomUUID().replace(/-/g, "").slice(0, 10)}`;
    const { error: insertError } = await admin.from("payment_transactions").insert({
      user_id: user.id, plan_id: plan.id, provider: "payu_payment_link",
      txnid, mihpayid: null, status: "pending", amount, currency: "INR",
      raw_response: { integration: "payment_links", stage: "created_locally" },
    });
    if (insertError) {
      console.error("Payment link pending order insert failed:", insertError);
      return NextResponse.json({ success: false, error: "Unable to create payment order." }, { status: 500 });
    }

    const tokenResponse = await fetch("https://uat-accounts.payu.in/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId, client_secret: clientSecret,
        grant_type: "client_credentials", scope: "create_payment_links",
      }),
      cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    const tokenData = await tokenResponse.json().catch(() => null);
    const accessToken = typeof tokenData?.access_token === "string" ? tokenData.access_token : "";
    if (!tokenResponse.ok || !accessToken) {
      console.error("PayU OAuth token request failed:", { status: tokenResponse.status, error: tokenData?.error });
      await admin.from("payment_transactions").update({ status: "error", raw_response: { integration: "payment_links", stage: "oauth_failed", httpStatus: tokenResponse.status } }).eq("txnid", txnid);
      return NextResponse.json({ success: false, error: "PayU authentication failed. Check the sandbox API credentials and permissions." }, { status: 502 });
    }

    const createResponse = await fetch("https://uatoneapi.payu.in/payment-links/", {
      method: "POST",
      headers: { "merchantId": merchantId, "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceNumber: txnid, isAmountFilledByCustomer: false, subAmount: amount,
        isPartialPaymentAllowed: false, maxPaymentsAllowed: 1,
        description: `SEOMETRICHUB ${plan.name}`, source: "API", currency: "INR",
        successURL: `${appUrl}/?payment=pending&invoice=${encodeURIComponent(txnid)}`,
        failureURL: `${appUrl}/?payment=failed&invoice=${encodeURIComponent(txnid)}`,
        customer: { name: firstName, email: user.email, phone },
        udf: { udf1: user.id, udf2: String(plan.id), udf3: String(plan.code), udf4: txnid },
      }),
      cache: "no-store", signal: AbortSignal.timeout(20000),
    });
    const payuData = await createResponse.json().catch(() => null) as PayUCreateResponse | null;
    const result = payuData?.result;
    const paymentUrl = result?.paymentLink;
    const invoiceNumber = result?.invoiceNumber || txnid;
    let safePaymentUrl = false;
    try {
      const u = new URL(paymentUrl || "");
      safePaymentUrl = u.protocol === "https:" && (u.hostname === "pmny.in" || u.hostname.endsWith(".pmny.in") || u.hostname === "payu.in" || u.hostname.endsWith(".payu.in"));
    } catch { safePaymentUrl = false; }

    if (!createResponse.ok || payuData?.status !== 0 || !paymentUrl || !safePaymentUrl || invoiceNumber !== txnid) {
      console.error("PayU Payment Link creation failed:", { httpStatus: createResponse.status, payuStatus: payuData?.status, message: payuData?.message });
      await admin.from("payment_transactions").update({
        status: "error",
        raw_response: { integration: "payment_links", stage: "link_creation_failed", httpStatus: createResponse.status, payuStatus: payuData?.status, message: payuData?.message || null },
      }).eq("txnid", txnid);
      return NextResponse.json({ success: false, error: "PayU could not create the payment link. Please check the sandbox merchant permissions." }, { status: 502 });
    }

    await admin.from("payment_transactions").update({
      raw_response: { integration: "payment_links", stage: "link_created", invoiceNumber, paymentLink: paymentUrl, payuResponse: payuData },
    }).eq("txnid", txnid);

    return NextResponse.json({ success: true, paymentUrl, transaction: { txnid, planCode: plan.code, planName: plan.name, amount } });
  } catch (error) {
    console.error("PayU Payment Link create error:", error);
    return NextResponse.json({ success: false, error: "Unable to create a PayU payment link. Please try again." }, { status: 500 });
  }
}
