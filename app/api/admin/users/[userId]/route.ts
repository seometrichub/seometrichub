import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    // ============================================================
    // 1. AUTHENTICATED USER
    // ============================================================

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    // ============================================================
    // 2. SERVER-ONLY ADMIN CLIENT
    // ============================================================

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Admin delete configuration is incomplete.",
      );

      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error.",
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

    // ============================================================
    // 3. VERIFY CURRENT USER IS ADMIN
    // ============================================================

    const {
      data: adminRecord,
      error: adminCheckError,
    } = await supabaseAdmin
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      adminCheckError ||
      !adminRecord ||
      adminRecord.role !== "admin"
    ) {
      if (adminCheckError) {
        console.error(
          "Admin delete access lookup failed:",
          adminCheckError,
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Admin access required.",
        },
        { status: 403 },
      );
    }

    // ============================================================
    // 4. TARGET USER
    // ============================================================

    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required.",
        },
        { status: 400 },
      );
    }

    // Protect current admin account.
    if (userId === user.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You cannot delete your own admin account.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // 5. PROTECT ALL ADMIN ACCOUNTS
    // ============================================================

    const {
      data: targetAdmin,
      error: targetAdminError,
    } = await supabaseAdmin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (targetAdminError) {
      console.error(
        "Target admin lookup failed:",
        targetAdminError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify the selected user.",
        },
        { status: 500 },
      );
    }

    if (targetAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin accounts cannot be deleted here.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // 6. VERIFY TARGET USER EXISTS
    // ============================================================

    const {
      data: targetUserData,
      error: targetUserError,
    } =
      await supabaseAdmin.auth.admin.getUserById(
        userId,
      );

    if (
      targetUserError ||
      !targetUserData.user
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found.",
        },
        { status: 404 },
      );
    }

    // ============================================================
    // 7. PROTECT USERS WITH PAYMENT HISTORY
    //
    // payment_transactions.user_id currently uses ON DELETE CASCADE.
    // Deleting a paid customer would therefore delete financial
    // transaction history. Block that here.
    // ============================================================

    const {
      data: paymentRecord,
      error: paymentCheckError,
    } = await supabaseAdmin
      .from("payment_transactions")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (paymentCheckError) {
      console.error(
        "Payment history lookup failed:",
        paymentCheckError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify payment history.",
        },
        { status: 500 },
      );
    }

    if (paymentRecord) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This user has payment history and cannot be permanently deleted.",
        },
        { status: 409 },
      );
    }

    // ============================================================
    // 8. DELETE USER
    //
    // Only non-admin users with no payment history reach here.
    // Related Free subscription/monthly usage rows are cleaned
    // through the existing database foreign-key cascade rules.
    // ============================================================

    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(
        userId,
      );

    if (deleteError) {
      console.error(
        "Admin user deletion failed:",
        deleteError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to delete the user. Please try again.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Unexpected admin user deletion error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}