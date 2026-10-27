import { sqlClient } from "@/src/server/db/client";
import { apiFailure, apiSuccess } from "@/src/server/http";

export async function GET(request: Request) {
  try {
    await sqlClient`select 1`;
    return apiSuccess(request, { status: "ready", database: "available" });
  } catch {
    return apiFailure(request, new Error("Database unavailable"));
  }
}
