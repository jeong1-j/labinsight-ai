import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requireSession } from "@/lib/guards";

const createProjectSchema = z.object({
  title: z.string().min(2),
  purpose: z.string().min(2),
  hypothesis: z.string().min(2),
  independentVariable: z.string().min(1),
  dependentVariable: z.string().min(1),
  controlledVariables: z.string().min(1),
  materials: z.string().min(1),
  method: z.string().min(1),
  theoryValue: z.string().optional(),
  field: z.string().min(1)
});

export async function GET() {
  try {
    const session = await requireSession();
    const projects = await prisma.project.findMany({
      where: session.user.role === "STUDENT" ? { studentId: session.user.id } : {},
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

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (session.user.role !== "STUDENT") {
      throw new Error("FORBIDDEN");
    }
    const body = createProjectSchema.parse(await request.json());
    const project = await prisma.project.create({
      data: {
        ...body,
        studentId: session.user.id,
        theoryValue: body.theoryValue || null
      }
    });
    return Response.json({ project }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
