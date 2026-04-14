"use client";

import { Navbar } from "@/components/Navbar";
import { useState } from "react";

// ─── 더미 데이터 ────────────────────────────────────────────

type Difficulty = "쉬움" | "보통" | "어려움";
type ProblemStatus = "solved" | "inprogress" | "created";

interface MyProblem {
  id: number;
  title: string;
  category: string;
  difficulty: Difficulty;
  status: ProblemStatus;
  date: string;
  progress?: number; // 풀던 문제 진행률 (%)
  language?: string; // 생성한 문제 언어
}

const DUMMY_PROBLEMS: MyProblem[] = [
  // 풀었던 문제
  { id: 1, title: "투 포인터 입문", category: "배열", difficulty: "쉬움", status: "solved", date: "2025-04-10" },
  { id: 2, title: "스택으로 괄호 검사", category: "스택", difficulty: "쉬움", status: "solved", date: "2025-04-08" },
  { id: 5, title: "재귀로 구현하는 팩토리얼", category: "재귀", difficulty: "쉬움", status: "solved", date: "2025-04-05" },
  { id: 7, title: "이진 탐색 기초", category: "탐색", difficulty: "보통", status: "solved", date: "2025-04-01" },
  // 풀던 문제
  { id: 3, title: "BFS로 최단 경로 찾기", category: "그래프", difficulty: "보통", status: "inprogress", date: "2025-04-12", progress: 60 },
  { id: 4, title: "DP 첫걸음 — 계단 오르기", category: "동적 프로그래밍", difficulty: "보통", status: "inprogress", date: "2025-04-11", progress: 30 },
  // 생성한 문제
  { id: 101, title: "나만의 슬라이딩 윈도우 문제", category: "배열", difficulty: "보통", status: "created", date: "2025-04-09", language: "Java" },
  { id: 102, title: "커스텀 DFS 미로 탈출", category: "그래프", difficulty: "어려움", status: "created", date: "2025-04-06", language: "Python" },
  { id: 103, title: "그리디 동전 거스름돈", category: "그리디", difficulty: "쉬움", status: "created", date: "2025-04-02", language: "Java" },
];

const DUMMY_USER = {
  nickname: "Dongwoo",
  email: "kimdongwoo0930@gmail.com",
  joinDate: "2025-03-15",
  solvedCount: 4,
  createdCount: 3,
  streak: 7,
};

// ─── 서브 컴포넌트 ──────────────────────────────────────────

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  쉬움: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20",
  보통: "bg-amber-400/10 text-amber-400 border border-amber-400/20",
  어려움: "bg-rose-400/10 text-rose-400 border border-rose-400/20",
};

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="panel-border rounded-2xl bg-bg2/70 p-5 text-center">
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function ProblemRow({ problem }: { problem: MyProblem }) {
  return (
    <div className="group panel-border flex flex-col gap-3 rounded-xl bg-bg2/50 p-4 transition hover:border-blue/30 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:gap-0">
      <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        {/* 제목 */}
        <p className="flex-1 font-medium text-slate-100 transition group-hover:text-white">
          {problem.title}
        </p>
        {/* 태그들 */}
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-blue/20 bg-blue/10 px-2.5 py-0.5 text-xs font-medium text-blue">
            {problem.category}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_STYLE[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          {problem.language && (
            <span className="rounded-full border border-purple/20 bg-purple/10 px-2.5 py-0.5 text-xs font-medium text-purple">
              {problem.language}
            </span>
          )}
        </div>
      </div>

      {/* 진행률 (풀던 문제) */}
      {problem.status === "inprogress" && problem.progress !== undefined && (
        <div className="flex items-center gap-3 sm:w-36">
          <div className="flex-1 overflow-hidden rounded-full bg-white/10 h-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue to-purple transition-all"
              style={{ width: `${problem.progress}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 w-7 text-right">{problem.progress}%</span>
        </div>
      )}

      {/* 날짜 + 이동 버튼 */}
      <div className="flex items-center justify-between sm:ml-4 sm:justify-end sm:gap-3">
        <span className="text-xs text-slate-500">{problem.date}</span>
        <a
          href={`/study?id=${problem.id}`}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-blue/40 hover:text-blue"
        >
          {problem.status === "solved" ? "다시 풀기" : problem.status === "inprogress" ? "이어 풀기" : "보기"}
        </a>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────

type Tab = "solved" | "inprogress" | "created";

const TABS: { key: Tab; label: string }[] = [
  { key: "solved", label: "풀었던 문제" },
  { key: "inprogress", label: "풀던 문제" },
  { key: "created", label: "생성한 문제" },
];

export default function MyPage() {
  const [tab, setTab] = useState<Tab>("solved");

  const filtered = DUMMY_PROBLEMS.filter((p) => p.status === tab);

  return (
    <div className="min-h-screen bg-bg text-slate-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8">
        {/* 프로필 헤더 */}
        <div className="mb-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {/* 아바타 */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue to-purple text-3xl font-bold text-white shadow-glow">
            {DUMMY_USER.nickname[0]}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{DUMMY_USER.nickname}</h1>
            <p className="mt-0.5 text-sm text-slate-400">{DUMMY_USER.email}</p>
            <p className="mt-1 text-xs text-slate-500">가입일 {DUMMY_USER.joinDate}</p>
          </div>
        </div>

        {/* 통계 */}
        <div className="mb-10 grid grid-cols-3 gap-4">
          <StatCard label="푼 문제" value={DUMMY_USER.solvedCount} sub="개" />
          <StatCard label="연속 학습" value={DUMMY_USER.streak} sub="일째" />
          <StatCard label="생성한 문제" value={DUMMY_USER.createdCount} sub="개" />
        </div>

        {/* 탭 */}
        <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                tab === key
                  ? "bg-gradient-to-r from-blue to-purple text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">
                ({DUMMY_PROBLEMS.filter((p) => p.status === key).length})
              </span>
            </button>
          ))}
        </div>

        {/* 문제 목록 */}
        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((problem) => (
              <ProblemRow key={problem.id} problem={problem} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-sm">아직 문제가 없어요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
