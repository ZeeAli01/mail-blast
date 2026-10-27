import pino from "pino";
import { getServerEnvironment } from "./env";

const env = getServerEnvironment();

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "mailblast", environment: env.NODE_ENV },
  redact: {
    paths: [
      "password",
      "authorization",
      "cookie",
      "req.headers.authorization",
      "req.headers.cookie",
      "emailBody",
      "html",
      "text",
    ],
    censor: "[REDACTED]",
  },
});
