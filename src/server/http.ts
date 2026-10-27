import { ZodError } from "zod";
import { newRequestId } from "./ids";

export type ApiErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "DELIVERY_DISABLED"
  | "CONFIGURATION_REQUIRED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function apiSuccess<T>(
  request: Request,
  data: T,
  status = 200,
): Response {
  const requestId = newRequestId(request);
  return Response.json(
    { data, meta: { requestId } },
    { status, headers: { "x-request-id": requestId } },
  );
}

export function apiFailure(request: Request, error: unknown): Response {
  const requestId = newRequestId(request);
  const appError = normalizeError(error);
  return Response.json(
    {
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details,
      },
      meta: { requestId },
    },
    { status: appError.status, headers: { "x-request-id": requestId } },
  );
}

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    return new AppError(
      "VALIDATION_ERROR",
      "The request is invalid.",
      422,
      error.flatten(),
    );
  }
  if (typeof error === "object" && error !== null && "code" in error) {
    const databaseCode = String(error.code);
    if (databaseCode === "23505")
      return new AppError("CONFLICT", "A matching record already exists.", 409);
    if (databaseCode === "23503")
      return new AppError(
        "VALIDATION_ERROR",
        "A referenced record is invalid.",
        422,
      );
  }
  return new AppError("INTERNAL_ERROR", "An unexpected error occurred.", 500);
}
