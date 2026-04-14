"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

// ─── 타입 ────────────────────────────────────────────────────

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

type StepKey = "language" | "studyType" | "topic" | "difficulty" | "detail";

type Answers = {
  language: string;   // "Java" | "Python"
  studyType: string;  // "언어 개념" | "알고리즘"
  topic: string;      // 개념명 또는 분야명
  difficulty: string;
  detail: string;
};

const STEP_ORDER: StepKey[] = ["language", "studyType", "topic", "difficulty", "detail"];

const QUESTIONS: Record<StepKey, string> = {
  language:  "어떤 언어로 학습할까요?",
  studyType: "어떤 유형의 학습을 원하시나요?",
  topic:     "어떤 주제를 다뤄볼까요?",
  difficulty:"난이도는 어느 정도로 할까요?",
  detail:    "추가 조건이 있으면 자유롭게 적어주세요.\n예) 스토리형 문제, 특정 메서드 사용 등",
};

// studyType 카드 데이터
const STUDY_TYPES = [
  {
    key: "언어 개념",
    icon: "🔬",
    description: "for문, 클래스 같은 문법을\n문제로 익혀요",
    badge: { label: "실행 과정 시각화 지원", color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
  },
  {
    key: "알고리즘",
    icon: "🧩",
    description: "투 포인터, DP 같은\n풀이 전략을 연습해요",
    badge: { label: "시각화 미지원 · 코드 제공", color: "text-slate-400 border-white/15 bg-white/5" },
  },
] as const;

// 언어별 개념 목록
const CONCEPTS: Record<string, string[]> = {
  Java:   ["변수/타입", "조건문", "반복문", "배열/ArrayList", "클래스/객체", "재귀", "예외처리"],
  Python: ["변수/타입", "조건문", "반복문", "리스트/튜플", "클래스/객체", "재귀", "예외처리"],
};

// 알고리즘 분야 (언어 무관)
const ALGORITHM_DOMAINS = ["자료구조", "DP", "그래프", "그리디", "투 포인터", "구현"];

const DIFFICULTY_OPTIONS = ["입문", "초급", "중급", "상급"];

function getTopicOptions(answers: Answers): string[] {
  if (answers.studyType === "언어 개념") return CONCEPTS[answers.language] ?? [];
  if (answers.studyType === "알고리즘") return ALGORITHM_DOMAINS;
  return [];
}

function buildPrompt(answers: Answers) {
  const detail = answers.detail.trim() || "특별한 추가 조건 없음";
  const typeLabel = answers.studyType === "언어 개념" ? "언어 개념 학습" : "알고리즘 문제";
  return [
    `다음 조건에 맞는 학습용 ${typeLabel} 1개를 만들어줘.`,
    `- 언어: ${answers.language}`,
    `- 학습 유형: ${answers.studyType}`,
    `- 주제: ${answers.topic}`,
    `- 난이도: ${answers.difficulty}`,
    `- 추가 조건: ${detail}`,
    answers.studyType === "언어 개념"
      ? "- 문제 설명, 코드 작성 요구사항, 예제 입출력 2개, 해설 포인트까지 포함해줘."
      : "- 문제 설명, 입력/출력 형식, 예제 2개, 풀이 힌트, 정답 코드까지 포함해줘.",
  ].join("\n");
}

// ─── 공통 서브 컴포넌트 ──────────────────────────────────────

function AIAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue to-purple shadow-[0_0_12px_rgba(59,130,246,0.4)]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isAI = msg.role === "assistant";
  return (
    <div className={`flex items-end gap-2.5 ${isAI ? "justify-start" : "justify-end"}`}>
      {isAI && <AIAvatar />}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 sm:text-[15px] ${
          isAI
            ? "rounded-bl-sm bg-white/8 text-slate-100"
            : "rounded-br-sm bg-gradient-to-r from-blue to-purple text-white"
        }`}
        style={{ whiteSpace: "pre-wrap" }}
      >
        {msg.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <AIAvatar />
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white/8 px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulseSoft"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── 학습 유형 선택 카드 ─────────────────────────────────────

function StudyTypeCards({ onSelect, disabled }: { onSelect: (v: string) => void; disabled: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {STUDY_TYPES.map((type) => (
        <button
          key={type.key}
          type="button"
          onClick={() => onSelect(type.key)}
          disabled={disabled}
          className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-blue/40 hover:bg-white/10 disabled:opacity-40"
        >
          <span className="text-2xl">{type.icon}</span>
          <div>
            <p className="font-semibold text-slate-100 transition group-hover:text-white">{type.key}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400" style={{ whiteSpace: "pre-wrap" }}>
              {type.description}
            </p>
          </div>
          <span className={`mt-auto inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${type.badge.color}`}>
            {type.badge.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────

export function PromptChatBuilder() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    language: "", studyType: "", topic: "", difficulty: "", detail: "",
  });
  const [freeInput, setFreeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 메시지 빌드
  const messages = useMemo<Message[]>(() => {
    const result: Message[] = [
      { id: 1, role: "assistant", text: "안녕하세요! AI 문제 만들기를 시작할게요.\n몇 가지 질문에 답해주시면 맞춤형 코딩 문제를 만들어 드릴게요 🎯" },
    ];

    STEP_ORDER.forEach((key, index) => {
      if (index <= stepIndex) {
        result.push({ id: result.length + 1, role: "assistant", text: QUESTIONS[key] });
      }
      const answer = answers[key];
      if (answer) {
        result.push({ id: result.length + 1, role: "user", text: answer });
        // 알고리즘 선택 시 안내 메시지 삽입
        if (key === "studyType" && answer === "알고리즘") {
          result.push({
            id: result.length + 1,
            role: "assistant",
            text: "알고리즘 문제는 현재 시각화를 지원하지 않아요.\n문제 설명 + 풀이 힌트 + 정답 코드를 제공해 드릴게요 📝",
          });
        }
      }
    });

    return result;
  }, [answers, stepIndex]);

  const isDone = stepIndex >= STEP_ORDER.length;
  const currentKey = isDone ? null : STEP_ORDER[stepIndex];
  const topicOptions = getTopicOptions(answers);
  const generatedPrompt = isDone ? buildPrompt(answers) : "";
  const studyHref = generatedPrompt ? `/study?prompt=${encodeURIComponent(generatedPrompt)}` : "/study";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function submitValue(value: string) {
    if (!currentKey) return;
    const normalized = value.trim();
    if (!normalized) return;

    setAnswers((prev) => ({ ...prev, [currentKey]: normalized }));
    setIsTyping(true);
    setCopied(false);

    setTimeout(() => {
      setIsTyping(false);
      setStepIndex((prev) => prev + 1);
      setFreeInput("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }, 700);
  }

  function handleFreeSubmit(e: FormEvent) {
    e.preventDefault();
    // detail 단계는 빈 값도 허용 (건너뜀)
    if (currentKey === "detail") submitValue(freeInput || "없음");
    else submitValue(freeInput);
  }

  async function handleCopyPrompt() {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
  }

  function reset() {
    setStepIndex(0);
    setAnswers({ language: "", studyType: "", topic: "", difficulty: "", detail: "" });
    setFreeInput("");
    setCopied(false);
  }

  // 현재 스텝의 옵션 버튼 목록
  const currentOptions: string[] | null =
    currentKey === "language" ? ["Java", "Python"]
    : currentKey === "difficulty" ? DIFFICULTY_OPTIONS
    : currentKey === "topic" ? topicOptions
    : null;

  return (
    <div className="flex h-screen flex-col bg-bg text-slate-50">
      {/* 헤더 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-bg/80 px-5 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue to-purple">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-slate-100">AI 문제 만들기</span>
        </div>
        <Link href="/" className="text-sm text-slate-400 transition hover:text-slate-200">← 홈으로</Link>
      </header>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {isTyping && <TypingIndicator />}

          {/* 완성 프롬프트 */}
          {isDone && !isTyping && (
            <div className="flex items-end gap-2.5">
              <AIAvatar />
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-blue/25 bg-blue/10 p-4">
                <p className="mb-2 text-xs font-semibold text-blue">생성된 프롬프트</p>
                <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-100">{generatedPrompt}</pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/15"
                  >
                    {copied ? "✓ 복사됨" : "프롬프트 복사"}
                  </button>
                  <Link
                    href={studyHref}
                    className="rounded-lg bg-gradient-to-r from-blue to-purple px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90"
                  >
                    이 프롬프트로 문제 만들기 →
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* 하단 입력 영역 */}
      {!isDone && (
        <div className="shrink-0 border-t border-white/10 bg-bg/80 px-4 py-4 backdrop-blur-xl sm:px-8">
          <div className="mx-auto max-w-2xl space-y-3">

            {/* 학습 유형 카드 선택 */}
            {currentKey === "studyType" && !isTyping && (
              <StudyTypeCards onSelect={submitValue} disabled={isTyping} />
            )}

            {/* 일반 옵션 버튼 */}
            {currentKey !== "studyType" && currentOptions && (
              <div className="flex flex-wrap gap-2">
                {currentOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => submitValue(option)}
                    disabled={isTyping}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-blue/60 hover:bg-blue/10 hover:text-white disabled:opacity-40"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* 텍스트 입력 (detail 단계 또는 직접 입력) */}
            {currentKey !== "studyType" && (
              <form onSubmit={handleFreeSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={freeInput}
                  onChange={(e) => setFreeInput(e.target.value)}
                  disabled={isTyping}
                  placeholder={
                    currentKey === "detail"
                      ? "추가 조건 입력 (없으면 Enter로 건너뜀)"
                      : "직접 입력..."
                  }
                  className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue/60 focus:ring-2 focus:ring-blue/20 disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={isTyping || (!freeInput.trim() && currentKey !== "detail")}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue to-purple text-white transition hover:opacity-90 disabled:opacity-40"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                  </svg>
                </button>
              </form>
            )}

            <p className="text-center text-xs text-slate-600">
              {currentKey === "detail"
                ? "Enter를 누르면 건너뜁니다"
                : currentKey === "studyType"
                ? "카드를 선택해 주세요"
                : "버튼을 선택하거나 직접 입력하세요"}
            </p>
          </div>
        </div>
      )}

      {/* 완료 시 하단 */}
      {isDone && (
        <div className="shrink-0 border-t border-white/10 bg-bg/80 px-4 py-4 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-2xl justify-center">
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm text-slate-300 transition hover:border-blue/40 hover:text-blue"
            >
              ↺ 처음부터 다시 만들기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
