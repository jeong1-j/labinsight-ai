import { NextRequest } from "next/server";
import { ProjectStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requireSession } from "@/lib/guards";
import { getAccessibleProject } from "@/lib/project-access";

const feedbackSchema = z.object({
  strengths: z.string().min(1),
  improvements: z.string().min(1),
  suggestion: z.string().min(1),
  finalComment: z.string().min(1)
});

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const project = await getAccessibleProject(id, session.user.id, session.user.role);
    return Response.json({ feedbacks: project.feedbacks });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (session.user.role !== "TEACHER" && session.user.role !== "DEVELOPER") {
      throw new Error("FORBIDDEN");
    }
    const { id } = await context.params;
    const project = await getAccessibleProject(id, session.user.id, session.user.role);
    const body = feedbackSchema.parse(await request.json());

    const feedback = await prisma.teacherFeedback.create({
      data: {
        ...body,
        teacherId: session.user.id,
        studentId: project.studentId,
        projectId: id
      },
      include: {
        teacher: true
      }
    });

    await prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.FEEDBACK_RECEIVED }
    });

    return Response.json({ feedback }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
