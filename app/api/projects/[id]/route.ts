import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requireSession } from "@/lib/guards";
import { getAccessibleProject } from "@/lib/project-access";

const updateProjectSchema = z.object({
  title: z.string().min(2).optional(),
  purpose: z.string().min(2).optional(),
  hypothesis: z.string().min(2).optional(),
  independentVariable: z.string().min(1).optional(),
  dependentVariable: z.string().min(1).optional(),
  controlledVariables: z.string().min(1).optional(),
  materials: z.string().min(1).optional(),
  method: z.string().min(1).optional(),
  theoryValue: z.string().nullable().optional(),
  field: z.string().min(1).optional()
});

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const project = await getAccessibleProject(id, session.user.id, session.user.role);
    return Response.json({ project });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (session.user.role !== "STUDENT") {
      throw new Error("FORBIDDEN");
    }
    const { id } = await context.params;
    await getAccessibleProject(id, session.user.id, session.user.role);
    const body = updateProjectSchema.parse(await request.json());
    const project = await prisma.project.update({
      where: { id },
      data: body
    });
    return Response.json({ project });
  } catch (error) {
    return jsonError(error);
  }
}
