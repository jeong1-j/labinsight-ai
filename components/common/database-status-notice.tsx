"use client";

import { useEffect, useState } from "react";

export function DatabaseStatusNotice() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/health/db")
      .then(async (response) => {
        if (response.ok) return null;
        const data = await response.json().catch(() => ({}));
        return data.error ?? "데이터베이스 연결 상태를 확인할 수 없습니다.";
      })
      .then((error) => {
        if (alive && error) setMessage(error);
      })
      .catch(() => {
        if (alive) setMessage("데이터베이스 상태 확인에 실패했습니다.");
      });

    return () => {
      alive = false;
    };
  }, []);

  if (!message) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
      {message}
      <span className="mt-1 block text-xs font-medium">
        회원가입과 로그인은 DB 준비 뒤 동작합니다. 로컬에서는 `npm run db:push`로 DB를 만들고,
        샘플 데이터가 필요할 때만 `npm run db:seed`를 실행하세요.
      </span>
    </div>
  );
}
