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
  language: string; // "Java" | "Python"
  studyType: string; // "언어 개념" | "알고리즘"
  topic: string; // 개념명 또는 분야명
  difficulty: string;
  detail: string;
};

const STEP_ORDER: StepKey[] = [
  "language",
  "studyType",
  "topic",
  "difficulty",
  "detail",
];

const QUESTIONS: Record<StepKey, string> = {
  language: "어떤 언어로 학습할까요?",
  studyType: "어떤 유형의 학습을 원하시나요?",
  topic: "어떤 주제를 다뤄볼까요?",
  difficulty: "난이도는 어느 정도로 할까요?",
  detail:
    "추가 조건이 있으면 자유롭게 적어주세요.\n예) 스토리형 문제, 특정 메서드 사용 등",
};

// 언어 카드 데이터
const LANGUAGE_TYPES = [
  {
    key: "Java",
    description: "정적 타입 언어로\n객체지향을 탄탄하게 익혀요",
    badge: {
      label: "실행 과정 시각화 지원",
      color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    },
  },
  {
    key: "Python",
    description: "간결한 문법으로\n빠르게 개념을 실험해요",
    badge: {
      label: "실행 과정 시각화 지원",
      color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    },
  },
] as const;

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

// 언어별 개념 목록
const CONCEPTS: Record<string, string[]> = {
  Java: [
    "변수/타입",
    "조건문",
    "반복문",
    "배열/ArrayList",
    "클래스/객체",
    "재귀",
    "예외처리",
  ],
  Python: [
    "변수/타입",
    "조건문",
    "반복문",
    "리스트/튜플",
    "클래스/객체",
    "재귀",
    "예외처리",
  ],
};

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
    description: "배열·함수·클래스 기초\n구조를 나눠 짜요",
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

function getTopicOptions(answers: Answers): string[] {
  if (answers.studyType === "언어 개념")
    return CONCEPTS[answers.language] ?? [];
  if (answers.studyType === "알고리즘") return ALGORITHM_DOMAINS;
  return [];
}

function buildPrompt(answers: Answers) {
  const detail = answers.detail.trim() || "특별한 추가 조건 없음";
  const typeLabel =
    answers.studyType === "언어 개념" ? "언어 개념 학습" : "알고리즘 문제";
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

// ─── 언어 아이콘 ─────────────────────────────────────────────

function JavaIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.851 18.56s-.917.534.653.714c1.902.218 2.874.187 4.969-.211 0 0 .552.346 1.321.646-4.699 2.013-10.633-.118-6.943-1.149zm-.575-2.627s-1.028.761.542.924c2.032.209 3.636.227 6.413-.308 0 0 .384.389.987.602-5.679 1.661-12.007.13-7.942-1.218zm4.84-4.858c1.158 1.333-.304 2.533-.304 2.533s2.939-1.518 1.589-3.418c-1.261-1.772-2.228-2.652 3.007-5.688 0 0-8.216 2.051-4.292 6.573zm6.214 9.454s.679.559-.747.991c-2.712.822-11.288 1.069-13.669.033-.856-.373.75-.89 1.254-.998.527-.114.828-.093.828-.093-.953-.671-6.156 1.317-2.643 1.887 9.58 1.553 17.462-.7 14.977-1.82zM9.292 13.21s-4.362 1.036-1.544 1.412c1.189.159 3.561.123 5.77-.062 1.806-.152 3.618-.477 3.618-.477s-.637.272-1.098.587c-4.429 1.165-12.986.623-10.522-.568 2.082-1.006 3.776-.892 3.776-.892zm7.824 4.374c4.503-2.34 2.421-4.589.968-4.285-.355.074-.515.138-.515.138s.132-.207.385-.297c2.875-1.011 5.086 2.981-.928 4.562 0-.001.07-.062.09-.118zM14.401 0s2.494 2.494-2.365 6.33c-3.896 3.077-.888 4.832-.001 6.836-2.274-2.053-3.943-3.858-2.824-5.539C10.855 5.158 15.408 3.962 14.401 0zM9.734 23.924c4.322.277 10.959-.153 11.116-2.198 0 0-.302.775-3.572 1.391-3.688.694-8.239.613-10.937.168 0-.001.553.457 3.393.639z"
        fill="#E76F00"
      />
    </svg>
  );
}

function PythonIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05L0 11.97l.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zM21.1 6.11l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09z"
        fill="#306998"
      />
      <path
        d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05L0 11.97l.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05z"
        fill="#FFD43B"
      />
    </svg>
  );
}

const LANG_ICONS: Record<string, React.ReactNode> = {
  Java: <JavaIcon />,
  Python: <PythonIcon />,
};

// ─── 언어 선택 카드 ─────────────────────────────────────────

function LanguageCards({
  onSelect,
  disabled,
}: {
  onSelect: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {LANGUAGE_TYPES.map((lang) => (
        <button
          key={lang.key}
          type="button"
          onClick={() => onSelect(lang.key)}
          disabled={disabled}
          className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-blue/40 hover:bg-white/10 disabled:opacity-40"
        >
          <span>{LANG_ICONS[lang.key]}</span>
          <div>
            <p className="font-semibold text-slate-100 transition group-hover:text-white">
              {lang.key}
            </p>
            <p
              className="mt-1 text-xs leading-5 text-slate-400"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {lang.description}
            </p>
          </div>
          <span
            className={`mt-auto inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${lang.badge.color}`}
          >
            {lang.badge.label}
          </span>
        </button>
      ))}
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
    language: "",
    studyType: "",
    topic: "",
    difficulty: "",
    detail: "",
  });
  const [freeInput, setFreeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 메시지 빌드
  const messages = useMemo<Message[]>(() => {
    const result: Message[] = [
      {
        id: 1,
        role: "assistant",
        text: "안녕하세요! AI 문제 만들기를 시작할게요.\n몇 가지 질문에 답해주시면 맞춤형 코딩 문제를 만들어 드릴게요 🎯",
      },
    ];

    STEP_ORDER.forEach((key, index) => {
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

  const isDone = stepIndex >= STEP_ORDER.length;
  const currentKey = isDone ? null : STEP_ORDER[stepIndex];
  const topicOptions = getTopicOptions(answers);
  const generatedPrompt = isDone ? buildPrompt(answers) : "";
  const studyHref = generatedPrompt
    ? `/study?prompt=${encodeURIComponent(generatedPrompt)}&studyType=${encodeURIComponent(answers.studyType)}`
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
    setAnswers({
      language: "",
      studyType: "",
      topic: "",
      difficulty: "",
      detail: "",
    });
    setFreeInput("");
    setCopied(false);
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
          <span className="font-semibold text-slate-100">AI 문제 만들기</span>
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

          <div ref={bottomRef} />
        </div>
      </div>

      {/* 하단 입력 영역 */}
      {!isDone && (
        <div className="shrink-0 border-t border-white/10 bg-bg/80 px-4 py-4 backdrop-blur-xl sm:px-8">
          <div className="mx-auto max-w-2xl space-y-3">
            {/* 언어 선택 카드 */}
            {currentKey === "language" && !isTyping && (
              <LanguageCards onSelect={submitValue} disabled={isTyping} />
            )}

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
            {currentKey !== "language" &&
              currentKey !== "studyType" &&
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
            {currentKey !== "language" &&
              currentKey !== "studyType" &&
              currentKey !== "difficulty" && (
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
                : currentKey === "language" ||
                    currentKey === "studyType" ||
                    currentKey === "difficulty"
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
