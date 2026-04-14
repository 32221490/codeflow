"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// GitHub OAuth 로그인 성공 후 서버가 이 페이지로 리다이렉트함
// URL 형태: /oauth/callback?token=eyJhbGci...
export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error === "email_private") {
      // GitHub 이메일이 private인 경우 → 홈으로 이동하면서 에러 전달
      router.replace("/?oauth_error=email_private");
      return;
    }

    if (token) {
      localStorage.setItem("accessToken", token);
    }

    router.replace("/");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-slate-300">
      <p className="text-sm">로그인 처리 중…</p>
    </div>
  );
}
