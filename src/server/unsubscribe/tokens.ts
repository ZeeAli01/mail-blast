import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getServerEnvironment } from "../env";

export function signUnsubscribeReference(reference: string): string {
  const signature = createHmac(
    "sha256",
    getServerEnvironment().DATA_ENCRYPTION_KEY,
  )
    .update(reference)
    .digest("base64url");
  return `${reference}.${signature}`;
}

export function verifyUnsubscribeReference(token: string): string | null {
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;
  const reference = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = createHmac(
    "sha256",
    getServerEnvironment().DATA_ENCRYPTION_KEY,
  )
    .update(reference)
    .digest("base64url");
  const givenBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    givenBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(givenBuffer, expectedBuffer)
  )
    return null;
  return reference;
}

export function digestUnsubscribeToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
