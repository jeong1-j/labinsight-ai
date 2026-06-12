import Link from "next/link";
import { BrandLockup } from "@/components/common/brand-lockup";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { getDashboardPath, type AppRole } from "@/lib/roles";

export function SidebarShell({
  children,
  role,
  userName
}: {
  children: React.ReactNode;
  role: AppRole;
  userName: string;
}) {
  const home = getDashboardPath(role);
  const roleLabel = role === "DEVELOPER" ? "개발자 계정" : role === "TEACHER" ? "교사 계정" : "학생 계정";
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="bg-primary text-white">
          <div className="sticky top-0 flex h-full flex-col gap-6 p-5">
            <BrandLockup compact />
            <nav className="grid gap-2 text-sm font-semibold">
              <Link className="rounded-lg px-3 py-2 hover:bg-white/10" href={home}>
                대시보드
              </Link>
              {role === "STUDENT" ? (
                <Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/projects/new">
                  새 실험 프로젝트
                </Link>
              ) : null}
              {role === "DEVELOPER" ? (
                <>
                  <Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/dashboard/teacher">
                    교사용 관리 화면
                  </Link>
                </>
              ) : null}
            </nav>
            <div className="mt-auto rounded-xl bg-white/10 p-4">
              <p className="text-xs text-white/70">{roleLabel}</p>
              <p className="mt-1 font-bold">{userName}</p>
              <SignOutButton />
            </div>
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
