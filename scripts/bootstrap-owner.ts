import { eq } from "drizzle-orm";
import { db, sqlClient } from "../src/server/db/client";
import { platformOperatorRoles, user } from "../src/server/db/schema";
import { getServerEnvironment } from "../src/server/env";

async function main() {
  const email = getServerEnvironment()
    .BOOTSTRAP_OWNER_EMAIL?.trim()
    .toLowerCase();
  if (!email)
    throw new Error("Set BOOTSTRAP_OWNER_EMAIL for this one-time command.");
  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (!existingUser)
    throw new Error(
      "Create and verify the owner account before bootstrapping it.",
    );
  await db
    .insert(platformOperatorRoles)
    .values({ userId: existingUser.id, role: "platform_owner" })
    .onConflictDoNothing();
  console.log(
    `Platform owner granted to ${email}. Remove BOOTSTRAP_OWNER_EMAIL now.`,
  );
  await sqlClient.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
