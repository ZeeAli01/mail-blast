import { apiSuccess } from "@/src/server/http";

export function GET(request: Request) {
  return apiSuccess(request, { status: "live", service: "mailblast" });
}
