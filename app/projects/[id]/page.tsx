import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessibleProject } from "@/lib/project-access";
import { SidebarShell } from "@/components/layout/app-shell";
import { ProjectWorkspace } from "@/components/student/project-workspace";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;
  const project = await getAccessibleProject(id, session.user.id, session.user.role);

  return (
    <SidebarShell role={session.user.role} userName={session.user.name ?? "사용자"}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <ProjectWorkspace project={JSON.parse(JSON.stringify(project))} role={session.user.role} />
      </div>
    </SidebarShell>
  );
}
