import { requirePlatformPermission } from "@/src/server/auth/authorization";
import { db } from "@/src/server/db/client";
import { organizations } from "@/src/server/db/schema";
import { apiFailure, apiSuccess } from "@/src/server/http";
import { desc, ilike } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    await requirePlatformPermission("platform.organizations.read");
    const query = new URL(request.url).searchParams.get("q")?.trim();
    const rows = await db
      .select()
      .from(organizations)
      .where(query ? ilike(organizations.name, `%${query}%`) : undefined)
      .orderBy(desc(organizations.createdAt))
      .limit(100);
    return apiSuccess(request, rows);
  } catch (error) {
    return apiFailure(request, error);
  }
}
