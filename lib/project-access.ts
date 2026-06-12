import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/roles";

export async function getAccessibleProject(projectId: string, userId: string, role: AppRole) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      student: true,
      experimentData: true,
      analysisResult: true,
      report: true,
      feedbacks: {
        include: {
          teacher: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!project) {
    throw new Error("NOT_FOUND");
  }

  if (role === "STUDENT" && project.studentId !== userId) {
    throw new Error("FORBIDDEN");
  }

  return project;
}

export function serializeProject<T extends { createdAt?: Date; updatedAt?: Date | null }>(project: T): T {
  return JSON.parse(JSON.stringify(project)) as T;
}
