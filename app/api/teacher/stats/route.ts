import { ProjectStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, requireRole } from "@/lib/guards";

export async function GET() {
  try {
    await requireRole(["TEACHER", "DEVELOPER"]);
    const [studentCount, projectCount, analyzedCount, reportCount, feedbackCount, projects] =
      await Promise.all([
        prisma.user.count({ where: { role: Role.STUDENT } }),
        prisma.project.count(),
        prisma.project.count({ where: { status: { in: [ProjectStatus.ANALYZED, ProjectStatus.REPORT_GENERATED, ProjectStatus.FEEDBACK_RECEIVED] } } }),
        prisma.report.count(),
        prisma.project.count({ where: { feedbacks: { none: {} }, status: { in: [ProjectStatus.ANALYZED, ProjectStatus.REPORT_GENERATED] } } }),
        prisma.project.findMany({ include: { analysisResult: true } })
      ]);
    const errorRates = projects
      .map((project) => project.analysisResult?.errorRate)
      .filter((value): value is number => typeof value === "number");
    const averageErrorRate = errorRates.length
      ? Number((errorRates.reduce((sum, value) => sum + value, 0) / errorRates.length).toFixed(1))
      : 0;

    return Response.json({
      stats: {
        studentCount,
        projectCount,
        analyzedCount,
        reportCount,
        feedbackCount,
        averageErrorRate
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
