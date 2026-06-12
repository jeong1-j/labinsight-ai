import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { AppRole } from "@/lib/roles";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(role: AppRole | AppRole[]) {
  const session = await requireSession();
  const allowedRoles = Array.isArray(role) ? role : [role];
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export function jsonError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  const status =
    message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "NOT_FOUND" ? 404 : 400;
  return Response.json({ error: message }, { status });
}
