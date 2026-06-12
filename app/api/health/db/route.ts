import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      {
        ok: false,
        error: "데이터베이스에 연결할 수 없습니다. 로컬에서는 npm run db:push 후 다시 시도하세요."
      },
      { status: 503 }
    );
  }
}
