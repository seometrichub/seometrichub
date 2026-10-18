
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyPayUPayment } from "./payu-verify";

vi.mock("server-only", () => ({}));

const txnid = "TEST_TXN_001";
const mihpayid = "PAYU_TEST_123";
const amount = 999;

function mockPayUResponse(
  transaction: Record<string, unknown>,
) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        transaction_details: {
          [txnid]: transaction,
        },
      }),
    }),
  );
}

describe("PayU server-side payment verification", () => {
  beforeEach(() => {
    vi.stubEnv("PAYU_MERCHANT_KEY", "test_merchant_key");
    vi.stubEnv("PAYU_MERCHANT_SALT", "test_merchant_salt");
    vi.stubEnv("PAYU_BASE_URL", "https://test.payu.in");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("accepts a successful matching payment", async () => {
    mockPayUResponse({
      status: "success",
      txnid,
      mihpayid,
      amt: "999.00",
    });

    const result = await verifyPayUPayment(
      txnid,
      amount,
      mihpayid,
    );

    expect(result).toEqual({
      verified: true,
      reason: "verified",
    });
  });

  it("rejects a failed payment", async () => {
    mockPayUResponse({
      status: "failure",
      txnid,
      mihpayid,
      amt: "999.00",
    });

    const result = await verifyPayUPayment(
      txnid,
      amount,
      mihpayid,
    );

    expect(result.verified).toBe(false);
  });

  it("rejects an amount mismatch", async () => {
    mockPayUResponse({
      status: "success",
      txnid,
      mihpayid,
      amt: "499.00",
    });

    const result = await verifyPayUPayment(
      txnid,
      amount,
      mihpayid,
    );

    expect(result.verified).toBe(false);
  });

  it("rejects a PayU payment ID mismatch", async () => {
    mockPayUResponse({
      status: "success",
      txnid,
      mihpayid: "DIFFERENT_PAYMENT_ID",
      amt: "999.00",
    });

    const result = await verifyPayUPayment(
      txnid,
      amount,
      mihpayid,
    );

    expect(result.verified).toBe(false);
  });

  it("rejects a transaction ID mismatch", async () => {
    mockPayUResponse({
      status: "success",
      txnid: "DIFFERENT_TXN",
      mihpayid,
      amt: "999.00",
    });

    const result = await verifyPayUPayment(
      txnid,
      amount,
      mihpayid,
    );

    expect(result.verified).toBe(false);
  });
});
