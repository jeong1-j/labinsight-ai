import { NextRequest } from "next/server";
import { z } from "zod";
import { ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { profileData } from "@/lib/chart-engine";
import { jsonError, requireSession } from "@/lib/guards";
import { getAccessibleProject } from "@/lib/project-access";
import { toPrismaJson } from "@/lib/json";

const dataSchema = z.object({
  rawData: z.array(z.record(z.union([z.string(), z.number(), z.null()]))).min(1),
  uploadedFileName: z.string().optional().nullable()
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (session.user.role !== "STUDENT") {
      throw new Error("FORBIDDEN");
    }
    const { id } = await context.params;
    await getAccessibleProject(id, session.user.id, session.user.role);
    const body = dataSchema.parse(await request.json());
    const profile = profileData(body.rawData);

    const experimentData = await prisma.experimentData.upsert({
      where: { projectId: id },
      update: {
        rawData: toPrismaJson(body.rawData),
        columns: toPrismaJson(profile),
        uploadedFileName: body.uploadedFileName ?? null
      },
      create: {
        projectId: id,
        rawData: toPrismaJson(body.rawData),
        columns: toPrismaJson(profile),
        uploadedFileName: body.uploadedFileName ?? null
      }
    });

    await prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.DATA_UPLOADED }
    });

    return Response.json({ experimentData, profile });
  } catch (error) {
    return jsonError(error);
  }
}
