import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function safeRedirectUrl(baseUrl: string, path: string) {
  return new URL(path, baseUrl).toString();
}

function sha512(value: string) {
  return createHash("sha512").update(value).digest("hex").toLowerCase();
}

export async function POST(request: Request) {
  try {
    const merchantKey = process.env.PAYU_MERCHANT_KEY;
    const merchantSalt = process.env.PAYU_MERCHANT_SALT;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // ============================================================
    // CONFIG CHECK
    // ============================================================

    if (
      !merchantKey ||
      !merchantSalt ||
      !appUrl ||
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      console.error("PayU callback configuration is incomplete.");

      return NextResponse.redirect(
        safeRedirectUrl(
          appUrl || "http://localhost:3000",
          "/?payment=configuration_error",
        ),
        303,
      );
    }

    // ============================================================
    // READ PAYU RESPONSE
    // ============================================================

    const formData = await request.formData();

    const getField = (name: string) => {
      const value = formData.get(name);
      return typeof value === "string" ? value.trim() : "";
    };

    const status = getField("status");
    const txnid = getField("txnid");
    const amount = getField("amount");
    const productinfo = getField("productinfo");
    const firstname = getField("firstname");
    const email = getField("email");
    const responseKey = getField("key");
    const receivedHash = getField("hash");

    const udf1 = getField("udf1");
    const udf2 = getField("udf2");
    const udf3 = getField("udf3");
    const udf4 = getField("udf4");
    const udf5 = getField("udf5");

    const mihpayid = getField("mihpayid");
    const unmappedstatus = getField("unmappedstatus");

    // PayU may use either naming style depending on response flow.
    const additionalCharges =
      getField("additional_charges") ||
      getField("additionalCharges");

    const splitInfo =
      getField("splitInfo") ||
      getField("split_info");

    // ============================================================
    // REQUIRED FIELD CHECK
    // ============================================================

    if (
      !status ||
      !txnid ||
      !amount ||
      !productinfo ||
      !firstname ||
      !email ||
      !responseKey ||
      !receivedHash
    ) {
      console.error("PayU callback missing required fields.", {
        status: Boolean(status),
        txnid: Boolean(txnid),
        amount: Boolean(amount),
        productinfo: Boolean(productinfo),
        firstname: Boolean(firstname),
        email: Boolean(email),
        responseKey: Boolean(responseKey),
        receivedHash: Boolean(receivedHash),
      });

      return NextResponse.redirect(
        safeRedirectUrl(appUrl, "/?payment=invalid_response"),
        303,
      );
    }

    // ============================================================
    // MERCHANT KEY CHECK
    // ============================================================

    if (responseKey !== merchantKey) {
      console.error("PayU callback merchant key mismatch.");

      return NextResponse.redirect(
        safeRedirectUrl(appUrl, "/?payment=invalid_key"),
        303,
      );
    }

    // ============================================================
    // PAYU RESPONSE HASH VERIFICATION
    //
    // Regular:
    // SALT|status||||||udf5|udf4|udf3|udf2|udf1|
    // email|firstname|productinfo|amount|txnid|key
    //
    // Additional charges:
    // additional_charges|SALT|status||||||...
    //
    // Split:
    // SALT|status|splitInfo||||||...
    //
    // Split + additional charges:
    // additional_charges|SALT|status|splitInfo||||||...
    // ============================================================

    const commonTail = [
      udf5,
      udf4,
      udf3,
      udf2,
      udf1,
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      responseKey,
    ];

    const reverseHashCandidates: string[] = [];

    // Regular PayU reverse hash
    reverseHashCandidates.push(
  [
    merchantSalt,
    status,
    "",
    "",
    "",
    "",
    "",
    ...commonTail,
  ].join("|"),
);

    // Additional charges
    if (additionalCharges) {
      reverseHashCandidates.push(
        [
          additionalCharges,
          merchantSalt,
          status,
          "",
          "",
          "",
          "",
          "",
          "",
          ...commonTail,
        ].join("|"),
      );
    }

    // Split transaction
    if (splitInfo) {
      reverseHashCandidates.push(
        [
          merchantSalt,
          status,
          splitInfo,
          "",
          "",
          "",
          "",
          "",
          "",
          ...commonTail,
        ].join("|"),
      );
    }

    // Additional charges + split transaction
    if (additionalCharges && splitInfo) {
      reverseHashCandidates.push(
        [
          additionalCharges,
          merchantSalt,
          status,
          splitInfo,
          "",
          "",
          "",
          "",
          "",
          "",
          ...commonTail,
        ].join("|"),
      );
    }

    const normalizedReceivedHash = receivedHash.toLowerCase();

    const hashMatched = reverseHashCandidates.some(
      (candidate) => sha512(candidate) === normalizedReceivedHash,
    );

    if (!hashMatched) {
      console.error("PayU callback hash verification failed.", {
        txnid,
        status,
        hasAdditionalCharges: Boolean(additionalCharges),
        hasSplitInfo: Boolean(splitInfo),
      });

      return NextResponse.redirect(
        safeRedirectUrl(appUrl, "/?payment=invalid_hash"),
        303,
      );
    }

    console.log("PayU callback hash verified:", {
      txnid,
      status,
      mihpayid,
    });

    // ============================================================
    // PAYMENT STATUS CHECK
    // ============================================================

    if (status.toLowerCase() !== "success") {
      console.log("PayU payment was not successful:", {
        txnid,
        status,
        unmappedstatus,
      });

      return NextResponse.redirect(
        safeRedirectUrl(
          appUrl,
          `/?payment=failed&txnid=${encodeURIComponent(txnid)}`,
        ),
        303,
      );
    }

    // ============================================================
    // SUBSCRIPTION METADATA
    // udf1 = user id
    // udf2 = plan id
    // udf3 = plan code
    // ============================================================

    const userId = udf1;
    const planId = Number(udf2);
    const planCode = udf3;

    if (
      !userId ||
      !Number.isInteger(planId) ||
      planId <= 0 ||
      !planCode
    ) {
      console.error("PayU callback has invalid subscription metadata.", {
        userId,
        planId,
        planCode,
      });

      return NextResponse.redirect(
        safeRedirectUrl(appUrl, "/?payment=invalid_metadata"),
        303,
      );
    }

    // ============================================================
    // SUPABASE ADMIN CLIENT
    // ============================================================

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // ============================================================
    // VERIFY PLAN SERVER-SIDE
    // ============================================================

    const { data: plan, error: planError } =
      await supabaseAdmin
        .from("plans")
        .select(
          "id, code, name, price_inr, duration_months, is_active",
        )
        .eq("id", planId)
        .eq("code", planCode)
        .eq("is_active", true)
        .single();

    if (planError || !plan) {
      console.error(
        "PayU callback plan lookup failed:",
        planError,
      );

      return NextResponse.redirect(
        safeRedirectUrl(appUrl, "/?payment=plan_error"),
        303,
      );
    }

    // ============================================================
    // VERIFY AMOUNT
    // ============================================================

    const expectedAmount = Number(plan.price_inr);
    const paidAmount = Number(amount);

    if (
      !Number.isFinite(expectedAmount) ||
      !Number.isFinite(paidAmount) ||
      expectedAmount <= 0 ||
      Math.abs(expectedAmount - paidAmount) > 0.01
    ) {
      console.error("PayU callback amount mismatch.", {
        expectedAmount,
        paidAmount,
      });

      return NextResponse.redirect(
        safeRedirectUrl(appUrl, "/?payment=amount_mismatch"),
        303,
      );
    }

    // ============================================================
    // VERIFY PLAN DURATION
    // ============================================================

    const durationMonths = Number(plan.duration_months);

    if (
      !Number.isInteger(durationMonths) ||
      durationMonths <= 0
    ) {
      console.error(
        "PayU callback invalid plan duration.",
      );

      return NextResponse.redirect(
        safeRedirectUrl(appUrl, "/?payment=duration_error"),
        303,
      );
    }

    // ============================================================
    // CALCULATE SUBSCRIPTION PERIOD
    // ============================================================

    const now = new Date();
    const periodEnd = new Date(now);

    periodEnd.setUTCMonth(
      periodEnd.getUTCMonth() + durationMonths,
    );

    // ============================================================
    // UPDATE USER SUBSCRIPTION
    // ============================================================

    const {
      data: updatedSubscription,
      error: subscriptionError,
    } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan_id: plan.id,
        status: "active",
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        subscription_end: periodEnd.toISOString(),
        payment_provider: "payu",
        payment_subscription_id: txnid,
        payment_id: mihpayid || txnid,
        updated_at: now.toISOString(),
      })
      .eq("user_id", userId)
      .select(
        "user_id, plan_id, status, current_period_end, payment_provider, payment_id",
      )
      .maybeSingle();

    if (subscriptionError) {
      console.error(
        "PayU callback subscription update failed:",
        subscriptionError,
      );

      return NextResponse.redirect(
        safeRedirectUrl(
          appUrl,
          "/?payment=subscription_error",
        ),
        303,
      );
    }

    if (!updatedSubscription) {
      console.error(
        "PayU callback subscription row was not found.",
        {
          userId,
          txnid,
        },
      );

      return NextResponse.redirect(
        safeRedirectUrl(
          appUrl,
          "/?payment=subscription_not_found",
        ),
        303,
      );
    }

    // ============================================================
    // SUCCESS
    // ============================================================

    console.log(
      "PayU payment verified and subscription activated:",
      {
        userId,
        planCode: plan.code,
        planName: plan.name,
        txnid,
        mihpayid,
        subscriptionEnd:
          updatedSubscription.current_period_end,
      },
    );

    return NextResponse.redirect(
      safeRedirectUrl(
        appUrl,
        `/?payment=success&plan=${encodeURIComponent(
          plan.code,
        )}`,
      ),
      303,
    );
  } catch (error) {
    console.error("PayU callback error:", error);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    return NextResponse.redirect(
      safeRedirectUrl(
        appUrl,
        "/?payment=callback_error",
      ),
      303,
    );
  }
}