export const APP_ROLES = ["STUDENT", "TEACHER", "DEVELOPER"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function getDashboardPath(role?: string | null) {
  if (role === "TEACHER") return "/dashboard/teacher";
  if (role === "DEVELOPER") return "/dashboard/developer";
  return "/dashboard/student";
}

export function canReviewProjects(role?: string | null) {
  return role === "TEACHER" || role === "DEVELOPER";
}

export function canSeeAllProjects(role?: string | null) {
  return role === "TEACHER" || role === "DEVELOPER";
}
