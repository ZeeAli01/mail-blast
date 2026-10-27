import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/send-email/route";

describe("legacy send endpoint", () => {
  it("fails closed without parsing or sending the request", async () => {
    const response = POST();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "EMAIL_DELIVERY_DISABLED",
        message:
          "Email delivery is disabled while the safe, configurable product is being built.",
      },
    });
  });
});
