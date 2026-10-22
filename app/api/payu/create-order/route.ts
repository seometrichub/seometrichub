import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

const ALLOWED_PAID_PLANS = [
  "pro_monthly",
  "pro_3_months",
  "pro_6_months",
  "pro_12_months",
] as const;

type PaidPlanCode = (typeof ALLOWED_PAID_PLANS)[number];

function isPaidPlanCode(value: string): value is PaidPlanCode {
  return ALLOWED_PAID_PLANS.includes(value as PaidPlanCode);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Please sign in before starting payment.",
        },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);

    const planCode =
      typeof body?.planCode === "string" ? body.planCode.trim() : "";

    const firstName =
      typeof body?.firstName === "string" ? body.firstName.trim() : "";

    const phone =
      typeof body?.phone === "string" ? body.phone.trim() : "";

    if (!isPaidPlanCode(planCode)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid paid plan selected.",
        },
        { status: 400 },
      );
    }

    if (!firstName) {
      return NextResponse.json(
        {
          success: false,
          error: "First name is required.",
        },
        { status: 400 },
      );
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid 10-digit phone number is required.",
        },
        { status: 400 },
      );
    }

    const merchantKey = process.env.PAYU_MERCHANT_KEY;
    const merchantSalt = process.env.PAYU_MERCHANT_SALT;
    const payuBaseUrl = process.env.PAYU_BASE_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !merchantKey ||
      !merchantSalt ||
      !payuBaseUrl ||
      !appUrl ||
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment configuration is incomplete.",
        },
        { status: 500 },
      );
    }

    const supabaseAdmin = createSupabaseAdmin(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("id, code, name, price_inr, duration_months, is_active")
      .eq("code", planCode)
      .eq("is_active", true)
      .single();

  if (planError || !plan) {
  console.error("PayU plan lookup failed:", planError);

  return NextResponse.json(
    {
      success: false,
      error: "Selected plan is unavailable.",
    },
    { status: 404 },
  );
}
    const amountNumber = Number(plan.price_inr);

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected plan price is invalid.",
        },
        { status: 400 },
      );
    }

    const email = user.email?.trim();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account does not have a valid email address.",
        },
        { status: 400 },
      );
    }

    const amount = amountNumber.toFixed(2);

    const txnid = `SMH-${Date.now()}-${randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)}`;

    const productinfo = `SEOMETRICHUB ${plan.name}`;

    const udf1 = user.id;
    const udf2 = String(plan.id);
    const udf3 = String(plan.code);
    const udf4 = "";
    const udf5 = "";

    const hashString = [
      merchantKey,
      txnid,
      amount,
      productinfo,
      firstName,
      email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      "",
      "",
      "",
      "",
      "",
      merchantSalt,
    ].join("|");

    const hash = createHash("sha512")
      .update(hashString)
      .digest("hex");

    const normalizedAppUrl = appUrl.replace(/\/+$/, "");
    let payuOrigin: string;
    try {
      payuOrigin = new URL(payuBaseUrl).origin;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid payment provider configuration." },
        { status: 500 },
      );
    }

    if (
      payuOrigin !== "https://test.payu.in" &&
      payuOrigin !== "https://secure.payu.in"
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid payment provider configuration." },
        { status: 500 },
      );
    }

    // Safety: the public staging host must never initiate a live PayU payment.
    // Validate the browser's request origin rather than trusting a client-supplied flag.
    const requestOrigin = request.headers.get("origin");
    let isStagingRequest = false;
    if (requestOrigin) {
      try {
        isStagingRequest = new URL(requestOrigin).hostname === "staging.seometrichub.com";
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid request origin." },
          { status: 400 },
        );
      }
    }
    if (
      (isStagingRequest || new URL(normalizedAppUrl).hostname === "staging.seometrichub.com") &&
      payuOrigin !== "https://test.payu.in"
    ) {
      console.error("Blocked live PayU checkout from staging.");
      return NextResponse.json(
        { success: false, error: "Staging payments require PayU Sandbox configuration." },
        { status: 503 },
      );
    }

    const paymentUrl = `${payuOrigin}/_payment`;

    const surl = `${normalizedAppUrl}/api/payu/callback`;
    const furl = `${normalizedAppUrl}/api/payu/callback`;
    // Save payment order before redirecting to PayU
const { error: pendingOrderError } = await supabaseAdmin
  .from("payment_transactions")
  .insert({
    user_id: user.id,
    plan_id: plan.id,
    provider: "payu",
    txnid,
    mihpayid: null,
    status: "pending",
    amount: amountNumber,
    currency: "INR",
    updated_at: new Date().toISOString(),
  });

if (pendingOrderError) {
  console.error("PayU pending order creation failed:", pendingOrderError);

  return NextResponse.json(
    {
      success: false,
      error: "Unable to create payment order. Please try again.",
    },
    { status: 500 },
  );
}

    return NextResponse.json({
      success: true,
      paymentUrl,
      fields: {
        key: merchantKey,
        txnid,
        amount,
        productinfo,
        firstname: firstName,
        email,
        phone,
        surl,
        furl,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
        hash,
      },
      transaction: {
        txnid,
        planCode: plan.code,
        planName: plan.name,
        amount,
      },
    });
  } catch (error) {
    console.error("PayU create-order error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to start PayU payment.",
      },
      { status: 500 },
    );
  }
}

