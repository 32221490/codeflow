"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

// ─── 타입 ────────────────────────────────────────────────────

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

type StepKey = "studyType" | "topic" | "difficulty" | "detail";

type Answers = {
  studyType: string; // "언어 개념" | "알고리즘"
  topic: string; // 개념명 또는 분야명
  difficulty: string;
  detail: string;
};

const stepOrder_CONCEPT:   StepKey[] = ["studyType", "topic", "detail"];
const stepOrder_ALGORITHM: StepKey[] = ["studyType", "topic", "difficulty", "detail"];

const QUESTIONS: Record<StepKey, string> = {
  studyType: "어떤 유형의 학습을 원하시나요?",
  topic: "어떤 주제를 다뤄볼까요?",
  difficulty: "난이도는 어느 정도로 할까요?",
  detail:
    "추가 조건이 있으면 자유롭게 적어주세요.\n예) 스토리형 문제, 특정 메서드 사용 등",
};

// studyType 카드 데이터
const STUDY_TYPES = [
  {
    key: "언어 개념",
    icon: "🔬",
    description: "for문, 클래스 같은 문법을\n문제로 익혀요",
    badge: {
      label: "실행 과정 시각화 지원",
      color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    },
  },
  {
    key: "알고리즘",
    icon: "🧩",
    description: "투 포인터, DP 같은\n풀이 전략을 연습해요",
    badge: {
      label: "시각화 미지원 · 코드 제공",
      color: "text-slate-400 border-white/15 bg-white/5",
    },
  },
] as const;

const LANGUAGE_STAGES = [
  { stage: 1,  key: "출력",         desc: "System.out.println" },
  { stage: 2,  key: "변수·자료형",  desc: "int, String, boolean" },
  { stage: 3,  key: "산술·연산자",  desc: "+, -, *, /, % 형변환" },
  { stage: 4,  key: "입력",         desc: "Scanner 사용법" },
  { stage: 5,  key: "조건문",       desc: "if / else if / switch" },
  { stage: 6,  key: "반복문",       desc: "for / while / break" },
  { stage: 7,  key: "배열",         desc: "1차원·2차원 배열" },
  { stage: 8,  key: "함수",         desc: "메서드·매개변수·return" },
  { stage: 9,  key: "문자열",       desc: "String 메서드" },
  { stage: 10, key: "재귀",         desc: "팩토리얼·피보나치·콜스택" },
  { stage: 11, key: "컬렉션 기초",  desc: "ArrayList·HashMap" },
];

const OOP_STAGES = [
  { stage: 12, key: "클래스·객체",        desc: "class, new, 인스턴스" },
  { stage: 13, key: "생성자·접근제어자",  desc: "public, private, this" },
  { stage: 14, key: "상속",               desc: "extends, super, override" },
  { stage: 15, key: "인터페이스·추상클래스", desc: "interface, abstract" },
  { stage: 16, key: "예외처리",           desc: "try-catch, throws" },
  { stage: 17, key: "제네릭·컬렉션 심화", desc: "List<T>, Map<K,V>" },
];

// 알고리즘 분야 (언어 무관)
const ALGORITHM_DOMAINS = [
  "자료구조",
  "DP",
  "그래프",
  "그리디",
  "투 포인터",
  "구현",
];

// 난이도 카드 데이터 (studyType별 분리)
const DIFFICULTY_TYPES_CONCEPT = [
  {
    key: "입문",
    icon: "🌱",
    description: "출력·변수·기본 연산\n코딩을 처음 시작해요",
    badge: {
      label: "문법 첫걸음",
      color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    },
  },
  {
    key: "초급",
    icon: "📘",
    description: "조건문·반복문\n흐름 제어를 익혀요",
    badge: {
      label: "제어문 활용",
      color: "text-blue border-blue/30 bg-blue/10",
    },
  },
  {
    key: "중급",
    icon: "⚡",
    description: "배열·함수·클래스 기초\n구조를 나눠 짜``요",
    badge: {
      label: "구조화 프로그래밍",
      color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    },
  },
  {
    key: "상급",
    icon: "🔥",
    description: "재귀·예외처리·고급 OOP\n언어 깊은 곳까지 다뤄요",
    badge: {
      label: "고급 문법",
      color: "text-red-400 border-red-400/30 bg-red-400/10",
    },
  },
] as const;

const DIFFICULTY_TYPES_ALGORITHM = [
  {
    key: "입문",
    icon: "🌱",
    description: "선형 탐색·단순 반복\n알고리즘 개념을 처음 접해요",
    badge: {
      label: "완전 탐색 수준",
      color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    },
  },
  {
    key: "초급",
    icon: "📘",
    description: "기본 정렬·이진 탐색\n한 가지 전략으로 풀어요",
    badge: {
      label: "단일 전략 적용",
      color: "text-blue border-blue/30 bg-blue/10",
    },
  },
  {
    key: "중급",
    icon: "⚡",
    description: "투 포인터·DP 기초·BFS/DFS\n풀이 전략 설계가 필요해요",
    badge: {
      label: "알고리즘 설계 필요",
      color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    },
  },
  {
    key: "상급",
    icon: "🔥",
    description: "복잡한 DP·그래프·최적화\n여러 개념을 조합해요",
    badge: {
      label: "심화 알고리즘",
      color: "text-red-400 border-red-400/30 bg-red-400/10",
    },
  },
] as const;

function getTopicOptions(answers: Answers): string[] | null {
  if (answers.studyType === "언어 개념") return null; // StageList로 별도 처리
  if (answers.studyType === "알고리즘") return ALGORITHM_DOMAINS;
  return [];
}


function getDifficultyFromStage(stageKey: string): string {
  const stage = LANGUAGE_STAGES.find((s) => s.key === stageKey);
  if (!stage) return "입문";
  if (stage.stage <= 3) return "입문";
  if (stage.stage <= 6) return "초급";
  if (stage.stage <= 9) return "중급";
  return "상급";
}

function buildPrompt(answers: Answers) {
  const detail = answers.detail.trim() || "특별한 추가 조건 없음";
  if (answers.studyType === "언어 개념") {
    return [
      `다음 조건에 맞는 Java 언어 개념 학습 문제 1개를 만들어줘.`,
      `- 언어: Java`,
      `- 주제: ${answers.topic}`,
      `- 난이도: ${getDifficultyFromStage(answers.topic)}`,
      `- 해결한 문제 수: 0`,
      `- 추가 조건: ${detail}`,
    ].join("\n");
  }
  return [
    `다음 조건에 맞는 Java 알고리즘 문제 1개를 만들어줘.`,
    `- 언어: Java`,
    `- 주제: ${answers.topic}`,
    `- 난이도: ${answers.difficulty}`,
    `- 추가 조건: ${detail}`,
    `- 문제 설명, 입력/출력 형식, 예제 2개, 풀이 힌트, 정답 코드까지 포함해줘.`,
  ].join("\n");
}

// ─── 공통 서브 컴포넌트 ──────────────────────────────────────

function AIAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue to-purple shadow-[0_0_12px_rgba(59,130,246,0.4)]">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
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
    <div
      className={`flex items-end gap-2.5 ${isAI ? "justify-start" : "justify-end"}`}
    >
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

function StudyTypeCards({
  onSelect,
  disabled,
}: {
  onSelect: (v: string) => void;
  disabled: boolean;
}) {
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
            <p className="font-semibold text-slate-100 transition group-hover:text-white">
              {type.key}
            </p>
            <p
              className="mt-1 text-xs leading-5 text-slate-400"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {type.description}
            </p>
          </div>
          <span
            className={`mt-auto inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${type.badge.color}`}
          >
            {type.badge.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── 언어 개념 스테이지 목록 ──────────────────────────────────

function StageList({
  onSelect,
  disabled,
}: {
  onSelect: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex justify-end">
      <div className="w-full max-w-[82%] overflow-hidden rounded-2xl rounded-br-sm border border-white/10 shadow-lg">

        {/* 기초 트랙 */}
        <div className="bg-[#111827] px-4 pb-3 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            단계 선택
          </p>
          <div className="space-y-0.5">
            {LANGUAGE_STAGES.map((s) => (
              <button
                key={s.stage}
                type="button"
                onClick={() => onSelect(s.key)}
                disabled={disabled}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/8 disabled:opacity-40"
              >
                <span className="w-7 shrink-0 font-mono text-xs text-slate-600 group-hover:text-blue">
                  {String(s.stage).padStart(2, "0")}
                </span>
                <span className="font-medium text-slate-200 group-hover:text-white">
                  {s.key}
                </span>
                <span className="ml-auto text-xs text-slate-600">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* OOP 트랙 */}
        <div className="bg-[#0b0f1a] px-4 pb-3 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-700">
              OOP 트랙
            </p>
            <span className="rounded-full border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-600">
              서비스 준비 중
            </span>
          </div>
          <div className="space-y-0.5 opacity-30">
            {OOP_STAGES.map((s) => (
              <div
                key={s.stage}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2"
              >
                <span className="w-7 shrink-0 font-mono text-xs text-slate-600">
                  {String(s.stage).padStart(2, "0")}
                </span>
                <span className="font-medium text-slate-400">{s.key}</span>
                <span className="ml-auto text-xs text-slate-600">{s.desc}</span>
                <span className="text-[11px]">🔒</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── 난이도 선택 카드 ─────────────────────────────────────────

function DifficultyCards({
  onSelect,
  disabled,
  studyType,
}: {
  onSelect: (v: string) => void;
  disabled: boolean;
  studyType: string;
}) {
  const types =
    studyType === "알고리즘"
      ? DIFFICULTY_TYPES_ALGORITHM
      : DIFFICULTY_TYPES_CONCEPT;
  return (
    <div className="grid grid-cols-2 gap-3">
      {types.map((d) => (
        <button
          key={d.key}
          type="button"
          onClick={() => onSelect(d.key)}
          disabled={disabled}
          className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-blue/40 hover:bg-white/10 disabled:opacity-40"
        >
          <span className="text-2xl">{d.icon}</span>
          <div>
            <p className="font-semibold text-slate-100 transition group-hover:text-white">
              {d.key}
            </p>
            <p
              className="mt-1 text-xs leading-5 text-slate-400"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {d.description}
            </p>
          </div>
          <span
            className={`mt-auto inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${d.badge.color}`}
          >
            {d.badge.label}
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
    studyType: "",
    topic: "",
    difficulty: "",
    detail: "",
  });
  const [freeInput, setFreeInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stepOrder = answers.studyType === "언어 개념"
    ? stepOrder_CONCEPT
    : stepOrder_ALGORITHM;

  // 메시지 빌드
  const messages = useMemo<Message[]>(() => {
    const result: Message[] = [
      {
        id: 1,
        role: "assistant",
        text: "안녕하세요! 자바 기반 AI 문제 만들기를 시작할게요.\n몇 가지 질문에 답해주시면 맞춤형 코딩 문제를 만들어 드릴게요 🎯",
      },
    ];

    stepOrder.forEach((key, index) => {
      if (index <= stepIndex) {
        result.push({
          id: result.length + 1,
          role: "assistant",
          text: QUESTIONS[key],
        });
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

  const isDone = stepIndex >= stepOrder.length;
  const currentKey = isDone ? null : stepOrder[stepIndex];
  const topicOptions = getTopicOptions(answers);
  const generatedPrompt = isDone ? buildPrompt(answers) : "";
  const studyHref = generatedPrompt
    ? `/study?prompt=${encodeURIComponent(generatedPrompt)}&studyType=${encodeURIComponent(answers.studyType)}&topic=${encodeURIComponent(answers.topic)}`
    : "/study";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function submitValue(value: string) {
    if (!currentKey) return;
    const normalized = value.trim();
    if (!normalized) return;

    setAnswers((prev) => ({ ...prev, [currentKey]: normalized }));
    setIsTyping(true);

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

  function reset() {
    setStepIndex(0);
    setAnswers({
      studyType: "",
      topic: "",
      difficulty: "",
      detail: "",
    });
    setFreeInput("");
  }

  // 현재 스텝의 옵션 버튼 목록
  const currentOptions: string[] | null =
    currentKey === "topic" ? topicOptions : null;

  return (
    <div className="flex h-screen flex-col bg-bg text-slate-50">
      {/* 헤더 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-bg/80 px-5 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue to-purple">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-slate-100">
            AI 문제 만들기 · Java
          </span>
        </div>
        <Link
          href="/"
          className="text-sm text-slate-400 transition hover:text-slate-200"
        >
          ← 홈으로
        </Link>
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
                <p className="mb-2 text-xs font-semibold text-blue">
                  생성된 프롬프트
                </p>
                <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-100">
                  {generatedPrompt}
                </pre>
                <div className="mt-4 flex flex-wrap gap-2">
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

          {/* 언어 개념 스테이지 목록 */}
          {currentKey === "topic" &&
            answers.studyType === "언어 개념" &&
            !isTyping && (
              <StageList onSelect={submitValue} disabled={isTyping} />
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

            {/* 난이도 카드 선택 */}
            {currentKey === "difficulty" && !isTyping && (
              <DifficultyCards
                onSelect={submitValue}
                disabled={isTyping}
                studyType={answers.studyType}
              />
            )}

            {/* 일반 옵션 버튼 */}
            {currentKey !== "studyType" &&
              currentKey !== "difficulty" &&
              currentOptions && (
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
            {currentKey !== "studyType" && currentKey !== "difficulty" && (
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
                  disabled={
                    isTyping || (!freeInput.trim() && currentKey !== "detail")
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue to-purple text-white transition hover:opacity-90 disabled:opacity-40"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22 11 13 2 9l20-7z" />
                  </svg>
                </button>
              </form>
            )}

            <p className="text-center text-xs text-slate-600">
              {currentKey === "detail"
                ? "Enter를 누르면 건너뜁니다"
                : currentKey === "studyType" || currentKey === "difficulty"
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
