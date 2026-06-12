import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEVELOPER_INVITE_CODE, TEACHER_INVITE_CODE } from "@/lib/auth";

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "이름은 2글자 이상 입력하세요."),
    email: z.string().trim().toLowerCase().email("이메일 형식이 올바르지 않습니다."),
    password: z.string().min(8, "비밀번호는 8자 이상 입력하세요."),
    school: z.string().trim().optional(),
    studentNumber: z.string().optional(),
    gradeOrClass: z.string().optional(),
    role: z.enum(["STUDENT", "TEACHER", "DEVELOPER"]),
    teacherCode: z.string().optional(),
    developerCode: z.string().optional()
  })
  .superRefine((value, context) => {
    const studentNumber = value.studentNumber ?? value.gradeOrClass;
    if (value.role === "STUDENT" && !/^\d{4}$/.test(studentNumber?.trim() ?? "")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["studentNumber"],
        message: "학생 학번은 숫자 4자리로 입력하세요."
      });
    }
    if (value.role !== "DEVELOPER" && (value.school?.trim().length ?? 0) < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["school"],
        message: "학교를 검색해서 선택하세요."
      });
    }
  });

export async function POST(request: NextRequest) {
  try {
    const body = registerSchema.parse(await request.json());
    if (body.role === "TEACHER" && body.teacherCode?.trim() !== TEACHER_INVITE_CODE) {
      return Response.json({ error: "교사 인증 코드가 올바르지 않습니다." }, { status: 403 });
    }
    if (body.role === "DEVELOPER" && body.developerCode?.trim() !== DEVELOPER_INVITE_CODE) {
      return Response.json({ error: "개발자 인증 코드가 올바르지 않습니다." }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const studentNumber = body.role === "STUDENT" ? (body.studentNumber ?? body.gradeOrClass ?? "").trim() : "";
    const schoolName = body.role === "DEVELOPER" ? (body.school?.trim() || "LabInsight AI") : body.school?.trim() ?? "";
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true, role: true }
    });

    if (existingUser) {
      if (body.role === "STUDENT") {
        return Response.json({ error: "이미 가입된 이메일입니다. 로그인 화면에서 로그인하세요." }, { status: 409 });
      }

      const user = await prisma.user.update({
        where: { email: body.email },
        data: {
          name: body.name,
          passwordHash,
          role: body.role,
          school: schoolName,
          gradeOrClass: ""
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      return Response.json({ user, upgraded: true });
    }

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
        school: schoolName,
        gradeOrClass: studentNumber
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return Response.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? "입력값을 확인하세요." }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
    }
    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") ||
      (error instanceof Error && error.message.includes("Can't reach database server"))
    ) {
      return Response.json(
        { error: "데이터베이스에 연결할 수 없습니다. 로컬에서는 npm run db:push 후 다시 시도하세요." },
        { status: 503 }
      );
    }
    return Response.json({ error: "회원가입에 실패했습니다. 서버 로그를 확인하세요." }, { status: 400 });
  }
}
