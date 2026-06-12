import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(role: "STUDENT" | "TEACHER") {
  const session = await requireSession();
  if (session.user.role !== role) {
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
