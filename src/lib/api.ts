import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/tenant";

/**
 * Tiny helpers for consistent JSON API responses + error mapping.
 * Use `apiHandler(async (req) => ...)` to get auth + error handling
 * for free in every route.
 */

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    { ok: false, error: message, ...extra },
    { status },
  );
}

export function handleApiError(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return jsonError("נדרשת התחברות", 401);
  }
  if (err instanceof ZodError) {
    return jsonError("נתונים לא תקינים", 422, { issues: err.flatten() });
  }
  console.error("[api] unhandled error", err);
  return jsonError(
    err instanceof Error ? err.message : "שגיאה פנימית",
    500,
  );
}
