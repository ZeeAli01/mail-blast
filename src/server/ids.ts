import { createId } from "@paralleldrive/cuid2";

export function newId(): string {
  return createId();
}

export function newRequestId(request: Request): string {
  const supplied = request.headers.get("x-request-id")?.trim();
  return supplied && supplied.length <= 128 ? supplied : newId();
}
