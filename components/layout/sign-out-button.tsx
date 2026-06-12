"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="accent"
      size="sm"
      className="mt-4 w-full"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      로그아웃
    </Button>
  );
}
