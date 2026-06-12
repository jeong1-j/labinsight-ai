import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "STUDENT" | "TEACHER" | "DEVELOPER";
      school: string;
      gradeOrClass: string;
    };
  }

  interface User {
    role: "STUDENT" | "TEACHER" | "DEVELOPER";
    school: string;
    gradeOrClass: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "STUDENT" | "TEACHER" | "DEVELOPER";
    school?: string;
    gradeOrClass?: string;
  }
}
