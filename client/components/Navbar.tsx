"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthModal } from "./AuthModal";

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0B0F1A" />
      <path
        d="M4,16 C8,8 12,8 16,16 C20,24 24,24 28,16"
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M4,20 C8,12 12,12 16,20 C20,28 24,28 28,20"
        fill="none"
        stroke="#6366F1"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M4,12 C8,4 12,4 16,12 C20,20 24,20 28,12"
        fill="none"
        stroke="#06B6D4"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.5"
      />
      <polygon points="30,16 27,13 27,19" fill="#8B5CF6" />
    </svg>
  );
}

const navItems = [
  { label: "홈", href: "#top" },
  { label: "시각화", href: "#visualizer" },
  { label: "학습", href: "#features" },
  { label: "문서", href: "#how-it-works" },
];

export function Navbar() {
  const [modal, setModal] = useState<"login" | "signup" | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 마운트 시 localStorage에서 토큰 확인
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("accessToken"));
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    setIsLoggedIn(false);
  }

  return (
    <>
      <header
        id="top"
        className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-bg/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="#top" className="flex items-center gap-3 text-lg font-bold">
            <LogoMark />
            <span className="text-slate-100">Code</span>
            <span className="text-gradient-soft -ml-2">Flow</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="transition hover:text-slate-100">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="rounded-md border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:border-red-400 hover:text-red-400"
              >
                로그아웃
              </button>
            ) : (
              <>
                <button
                  onClick={() => setModal("login")}
                  className="hidden rounded-md border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:border-blue hover:text-blue sm:inline-flex"
                >
                  로그인
                </button>
                <button
                  onClick={() => setModal("signup")}
                  className="rounded-md bg-gradient-to-r from-blue to-purple px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:opacity-90"
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {modal && (
        <AuthModal
          initialMode={modal}
          onClose={() => setModal(null)}
          onSuccess={() => setIsLoggedIn(true)}
        />
      )}
    </>
  );
}
