import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

export type JsonRecord = Record<string, unknown>;

export function getAdminSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server environment variables are not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isAuthorized(request: Request) {
  const configuredSecret = process.env.DASHBOARD_INGEST_API_KEY;
  if (!configuredSecret) return false;

  const authorization = request.headers.get("authorization");
  const suppliedSecret =
    request.headers.get("x-api-key") ??
    (authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null);

  if (!suppliedSecret) return false;

  const expected = Buffer.from(configuredSecret);
  const received = Buffer.from(suppliedSecret);

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}

export async function readJson(request: Request) {
  try {
    const value: unknown = await request.json();

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    return value as JsonRecord;
  } catch {
    return null;
  }
}

export function textField(
  body: JsonRecord,
  key: string,
  options: { required?: boolean; maxLength?: number } = {}
) {
  const rawValue = body[key];
  const value = typeof rawValue === "string" ? rawValue.trim() : "";
  const maxLength = options.maxLength ?? 500;

  if (options.required && !value) {
    throw new Error(`${key} is required.`);
  }

  return value ? value.slice(0, maxLength) : null;
}

export function numberField(
  body: JsonRecord,
  key: string,
  options: { required?: boolean; min?: number } = {}
) {
  const rawValue = body[key];
  const value = typeof rawValue === "number" ? rawValue : Number(rawValue);

  if (!Number.isFinite(value)) {
    if (options.required) throw new Error(`${key} must be a number.`);
    return null;
  }

  if (options.min !== undefined && value < options.min) {
    throw new Error(`${key} must be at least ${options.min}.`);
  }

  return value;
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized." }, { status: 401 });
}

export function invalidRequestResponse(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof Error ? error.message : "Invalid request payload.",
    },
    { status: 400 }
  );
}

export function serverErrorResponse(error: unknown) {
  console.error("Dashboard integration error", error);

  return Response.json(
    { error: "Unable to process the integration event." },
    { status: 500 }
  );
}
