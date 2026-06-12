import { NextRequest } from "next/server";
import { ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeExperiment } from "@/lib/ai-analysis";
import { jsonError, requireSession } from "@/lib/guards";
import { getAccessibleProject } from "@/lib/project-access";
import { toPrismaJson } from "@/lib/json";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (session.user.role !== "STUDENT") {
      throw new Error("FORBIDDEN");
    }
    const { id } = await context.params;
    const project = await getAccessibleProject(id, session.user.id, session.user.role);
    if (!project.experimentData || !Array.isArray(project.experimentData.rawData)) {
      return Response.json({ error: "먼저 실험 데이터를 저장하세요." }, { status: 400 });
    }

    const output = await analyzeExperiment({
      title: project.title,
      purpose: project.purpose,
      hypothesis: project.hypothesis,
      independentVariable: project.independentVariable,
      dependentVariable: project.dependentVariable,
      controlledVariables: project.controlledVariables,
      field: project.field,
      theoryValue: project.theoryValue,
      data: project.experimentData.rawData as Record<string, string | number | null>[]
    });

    const analysisResult = await prisma.analysisResult.upsert({
      where: { projectId: id },
      update: {
        chartType: output.chartType,
        summaryStats: toPrismaJson(output.summaryStats),
        interpretation: output.interpretation,
        hypothesisResult: output.hypothesisResult,
        errorRate: output.errorRate,
        errorAnalysis: toPrismaJson(output.errorAnalysis),
        variableAnalysis: toPrismaJson(output.variableAnalysis),
        researchSuggestions: toPrismaJson(output.researchSuggestions)
      },
      create: {
        projectId: id,
        chartType: output.chartType,
        summaryStats: toPrismaJson(output.summaryStats),
        interpretation: output.interpretation,
        hypothesisResult: output.hypothesisResult,
        errorRate: output.errorRate,
        errorAnalysis: toPrismaJson(output.errorAnalysis),
        variableAnalysis: toPrismaJson(output.variableAnalysis),
        researchSuggestions: toPrismaJson(output.researchSuggestions)
      }
    });

    await prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.ANALYZED }
    });

    return Response.json({ analysisResult, reportDraft: output.reportDraft });
  } catch (error) {
    return jsonError(error);
  }
}
