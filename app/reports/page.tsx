import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardPath } from "@/lib/roles";

export default async function ReportsIndexPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  redirect(getDashboardPath(session.user.role));
}
