import { z } from "zod";

const serverEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default(
      "postgresql://app_runtime:runtime_local_only@127.0.0.1:5432/email_product",
    ),
  DATABASE_WORKER_URL: z
    .string()
    .min(1)
    .default(
      "postgresql://app_worker:worker_local_only@127.0.0.1:5432/email_product",
    ),
  DATABASE_MIGRATION_URL: z
    .string()
    .min(1)
    .default(
      "postgresql://app_migration:migration_local_only@127.0.0.1:5432/email_product",
    ),
  AUTH_SECRET: z
    .string()
    .min(32)
    .default("local-development-secret-change-before-deploy"),
  DATA_ENCRYPTION_KEY: z
    .string()
    .min(16)
    .default("local-development-key-change-me"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  EMAIL_DELIVERY_MODE: z.enum(["disabled", "capture"]).default("disabled"),
  EMAIL_CAPTURE_DIR: z.string().default(".local/email-captures"),
  STORAGE_DRIVER: z.literal("local").default("local"),
  LOCAL_STORAGE_ROOT: z.string().default(".local/storage"),
  BILLING_PROVIDER: z.literal("local").default("local"),
  WORKER_POLL_INTERVAL_MS: z.coerce
    .number()
    .int()
    .min(250)
    .max(60_000)
    .default(1_000),
  WORKER_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(25),
  BOOTSTRAP_OWNER_EMAIL: z.email().optional(),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

let parsedEnvironment: ServerEnvironment | undefined;

export function getServerEnvironment(): ServerEnvironment {
  parsedEnvironment ??= serverEnvironmentSchema.parse(process.env);
  const isProductionRuntime =
    parsedEnvironment.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build";
  if (isProductionRuntime) {
    if (
      parsedEnvironment.AUTH_SECRET ===
      "local-development-secret-change-before-deploy"
    )
      throw new Error("AUTH_SECRET must be configured for production.");
    if (
      parsedEnvironment.DATA_ENCRYPTION_KEY ===
      "local-development-key-change-me"
    )
      throw new Error("DATA_ENCRYPTION_KEY must be configured for production.");
    if (parsedEnvironment.DATABASE_URL.includes("local_only"))
      throw new Error(
        "Production cannot use the documented local database credentials.",
      );
  }
  return parsedEnvironment;
}
