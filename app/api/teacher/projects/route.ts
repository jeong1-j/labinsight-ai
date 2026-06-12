import { prisma } from "@/lib/prisma";
import { jsonError, requireRole } from "@/lib/guards";

export async function GET() {
  try {
    await requireRole(["TEACHER", "DEVELOPER"]);
    const projects = await prisma.project.findMany({
      include: {
        student: true,
        experimentData: true,
        analysisResult: true,
        report: true,
        feedbacks: true
      },
      orderBy: { updatedAt: "desc" }
    });
    return Response.json({ projects });
  } catch (error) {
    return jsonError(error);
  }
}
