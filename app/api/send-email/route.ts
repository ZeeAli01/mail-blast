import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json(
    {
      error: {
        code: "EMAIL_DELIVERY_DISABLED",
        message:
          "Email delivery is disabled while the safe, configurable product is being built.",
      },
    },
    { status: 503 },
  );
}
