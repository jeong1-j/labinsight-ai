import bcrypt from "bcryptjs";
import { PrismaClient, ProjectStatus, Role } from "@prisma/client";
import { analyzeExperiment } from "../lib/ai-analysis";
import { generateReportDraft } from "../lib/report-generator";
import { toPrismaJson } from "../lib/json";

const prisma = new PrismaClient();

const sampleData = [
  { day: 1, light_intensity: 200, temperature: 24.1, humidity: 61, co2: 410, plant_height: 4.2 },
  { day: 2, light_intensity: 250, temperature: 24.3, humidity: 60, co2: 415, plant_height: 4.5 },
  { day: 3, light_intensity: 300, temperature: 24.2, humidity: 59, co2: 420, plant_height: 4.9 },
  { day: 4, light_intensity: 350, temperature: 24.5, humidity: 58, co2: 425, plant_height: 5.4 },
  { day: 5, light_intensity: 400, temperature: 24.6, humidity: 57, co2: 430, plant_height: 6.0 },
  { day: 6, light_intensity: 450, temperature: 24.8, humidity: 56, co2: 435, plant_height: 6.7 },
  { day: 7, light_intensity: 500, temperature: 25.0, humidity: 55, co2: 440, plant_height: 7.5 }
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const allowDemoSeed = databaseUrl.startsWith("file:") || process.env.ALLOW_DEMO_SEED === "true";
  if (!allowDemoSeed) {
    throw new Error(
      "Seed creates demo accounts. Use real registration in production, or set ALLOW_DEMO_SEED=true for a non-production demo database."
    );
  }

  const passwordHash = await bcrypt.hash("password123", 12);

  const student = await prisma.user.upsert({
    where: { email: "student@jshs.kr" },
    update: {},
    create: {
      name: "김라온",
      email: "student@jshs.kr",
      passwordHash,
      role: Role.STUDENT,
      school: "전남과학고등학교",
      gradeOrClass: "2514"
    }
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@jshs.kr" },
    update: {},
    create: {
      name: "이하늘",
      email: "teacher@jshs.kr",
      passwordHash,
      role: Role.TEACHER,
      school: "전남과학고등학교",
      gradeOrClass: ""
    }
  });

  if (process.env.ALLOW_DEMO_PROJECT !== "true") {
    return;
  }

  let project = await prisma.project.findFirst({
    where: {
      studentId: student.id,
      title: "빛의 세기가 식물 성장에 미치는 영향"
    }
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        studentId: student.id,
        title: "빛의 세기가 식물 성장에 미치는 영향",
        purpose: "빛의 세기가 강해질수록 식물의 성장 높이가 어떻게 달라지는지 확인한다.",
        hypothesis: "빛의 세기가 강할수록 식물의 생장이 증가할 것이다.",
        independentVariable: "빛의 세기",
        dependentVariable: "식물 높이",
        controlledVariables: "온도, 습도, 이산화탄소 농도, 물의 양, 측정 시간",
        materials: "식물 묘목, LED 조명, 조도계, 온습도계, 자, 기록지",
        method: "7일 동안 빛의 세기를 단계적으로 조절하며 같은 시간에 식물 높이를 측정한다.",
        theoryValue: "7.0",
        field: "생명과학",
        status: ProjectStatus.DATA_UPLOADED
      }
    });
  }

  const analysis = await analyzeExperiment({
    title: project.title,
    purpose: project.purpose,
    hypothesis: project.hypothesis,
    independentVariable: project.independentVariable,
    dependentVariable: project.dependentVariable,
    controlledVariables: project.controlledVariables,
    field: project.field,
    theoryValue: project.theoryValue,
    data: sampleData
  });

  const experimentData = await prisma.experimentData.upsert({
    where: { projectId: project.id },
    update: {
      rawData: toPrismaJson(sampleData),
      columns: toPrismaJson(analysis.summaryStats),
      uploadedFileName: "plant-growth-sample.csv"
    },
    create: {
      projectId: project.id,
      rawData: toPrismaJson(sampleData),
      columns: toPrismaJson(analysis.summaryStats),
      uploadedFileName: "plant-growth-sample.csv"
    }
  });

  const analysisResult = await prisma.analysisResult.upsert({
    where: { projectId: project.id },
    update: {
      chartType: analysis.chartType,
      summaryStats: toPrismaJson(analysis.summaryStats),
      interpretation: analysis.interpretation,
      hypothesisResult: analysis.hypothesisResult,
      errorRate: analysis.errorRate,
      errorAnalysis: toPrismaJson(analysis.errorAnalysis),
      variableAnalysis: toPrismaJson(analysis.variableAnalysis),
      researchSuggestions: toPrismaJson(analysis.researchSuggestions)
    },
    create: {
      projectId: project.id,
      chartType: analysis.chartType,
      summaryStats: toPrismaJson(analysis.summaryStats),
      interpretation: analysis.interpretation,
      hypothesisResult: analysis.hypothesisResult,
      errorRate: analysis.errorRate,
      errorAnalysis: toPrismaJson(analysis.errorAnalysis),
      variableAnalysis: toPrismaJson(analysis.variableAnalysis),
      researchSuggestions: toPrismaJson(analysis.researchSuggestions)
    }
  });

  const feedback = await prisma.teacherFeedback.findFirst({ where: { projectId: project.id } });
  if (!feedback) {
    await prisma.teacherFeedback.create({
      data: {
        teacherId: teacher.id,
        studentId: student.id,
        projectId: project.id,
        strengths: "독립변인과 종속변인이 명확하고 데이터를 일별로 꾸준히 기록했습니다.",
        improvements: "동일 조도 조건에서 반복 측정을 추가하면 평균과 표준편차를 비교할 수 있습니다.",
        suggestion: "빛의 파장별 조건을 추가해 식물 생장 차이를 비교해 보세요.",
        finalComment: "그래프 해석이 좋습니다. 통제 변인 기록을 더 자세히 남기면 보고서 완성도가 올라갑니다."
      }
    });
  }

  await prisma.report.upsert({
    where: { projectId: project.id },
    update: {
      content: generateReportDraft({
        project,
        experimentData,
        analysisResult,
        feedbacks: await prisma.teacherFeedback.findMany({ where: { projectId: project.id } })
      })
    },
    create: {
      projectId: project.id,
      content: generateReportDraft({
        project,
        experimentData,
        analysisResult,
        feedbacks: await prisma.teacherFeedback.findMany({ where: { projectId: project.id } })
      })
    }
  });

  await prisma.project.update({
    where: { id: project.id },
    data: { status: ProjectStatus.FEEDBACK_RECEIVED }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
