import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.env.DEV_ACCOUNT_EMAIL?.trim().toLowerCase() || "developer@labinsight.local";
const password = process.env.DEV_ACCOUNT_PASSWORD || "password123";
const name = process.env.DEV_ACCOUNT_NAME || "LabInsight 개발자";

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: Role.DEVELOPER,
      school: "LabInsight AI",
      gradeOrClass: ""
    },
    create: {
      name,
      email,
      passwordHash,
      role: Role.DEVELOPER,
      school: "LabInsight AI",
      gradeOrClass: ""
    },
    select: {
      email: true,
      role: true
    }
  });

  console.log(`Developer account ready: ${user.email} (${user.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
