import { NextRequest } from "next/server";
import { ProjectStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requireSession } from "@/lib/guards";
import { getAccessibleProject } from "@/lib/project-access";
import { generateReportDraft } from "@/lib/report-generator";

const updateReportSchema = z.object({
  content: z.string().min(1)
});

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const project = await getAccessibleProject(id, session.user.id, session.user.role);
    return Response.json({ report: project.report });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (session.user.role !== "STUDENT") {
      throw new Error("FORBIDDEN");
    }
    const { id } = await context.params;
    const project = await getAccessibleProject(id, session.user.id, session.user.role);
    const content =
      project.report?.content ??
      generateReportDraft({
        project,
        experimentData: project.experimentData,
        analysisResult: project.analysisResult,
        feedbacks: project.feedbacks
      });

    const report = await prisma.report.upsert({
      where: { projectId: id },
      update: { content },
      create: { projectId: id, content }
    });

    await prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.REPORT_GENERATED }
    });

    return Response.json({ report });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (session.user.role !== "STUDENT") {
      throw new Error("FORBIDDEN");
    }
    const { id } = await context.params;
    await getAccessibleProject(id, session.user.id, session.user.role);
    const body = updateReportSchema.parse(await request.json());
    const report = await prisma.report.upsert({
      where: { projectId: id },
      update: { content: body.content },
      create: { projectId: id, content: body.content }
    });
    return Response.json({ report });
  } catch (error) {
    return jsonError(error);
  }
}
