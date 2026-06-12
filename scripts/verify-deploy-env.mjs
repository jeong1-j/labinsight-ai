const required = ["DATABASE_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET", "TEACHER_INVITE_CODE", "DEVELOPER_INVITE_CODE"];
const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length) {
  console.error(`Missing required deployment environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL)) {
  console.error("Deployment DATABASE_URL must be a PostgreSQL connection string.");
  process.exit(1);
}

if (!/^https:\/\//.test(process.env.NEXTAUTH_URL)) {
  console.error("Deployment NEXTAUTH_URL must be the public https URL of the deployed site.");
  process.exit(1);
}

if (process.env.NEXTAUTH_SECRET.length < 24) {
  console.error("NEXTAUTH_SECRET should be at least 24 characters long.");
  process.exit(1);
}

console.log("Deployment environment variables look ready.");
