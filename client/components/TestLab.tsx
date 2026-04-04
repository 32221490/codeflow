"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type StackVar = { name: string; type: string; value: string };
type HeapItem = { addr: string; type: string; value: string };
type Snapshot = {
  line: number;
  stack: StackVar[];
  heap: HeapItem[];
  output: string;
  note: string;
};
type Language = "java" | "python";
type Template = { label: string; code: string };
type Trace = {
  title: string;
  code: string;
  snapshots: Snapshot[];
  language: Language;
};

// ─────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────
const JAVA_TEMPLATES: Template[] = [
  {
    label: "합계 계산",
    code: `public class Main {
  public static void main(String[] args) {
    int a = 10;
    int b = 20;
    int sum = a + b;
    String msg = "sum=" + sum;
    System.out.println(msg);
  }
}`,
  },
  {
    label: "배열 최댓값",
    code: `public class Main {
  public static void main(String[] args) {
    int[] arr = {3, 9, 1, 7};
    int max = arr[0];
    for (int i = 1; i < arr.length; i++) {
      if (arr[i] > max) max = arr[i];
    }
    System.out.println(max);
  }
}`,
  },
  {
    label: "투 포인터",
    code: `public class Main {
  public static void main(String[] args) {
    int[] arr = {1, 2, 4, 7, 11};
    int left = 0, right = arr.length - 1;
    int target = 9;
    while (left < right) {
      int sum = arr[left] + arr[right];
      if (sum == target) break;
      if (sum < target) left++;
      else right--;
    }
    System.out.println(left + "," + right);
  }
}`,
  },
  {
    label: "피보나치",
    code: `public class Main {
  public static void main(String[] args) {
    int n = 7;
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
      int tmp = a + b;
      a = b;
      b = tmp;
    }
    System.out.println(b);
  }
}`,
  },
];

const PYTHON_TEMPLATES: Template[] = [
  {
    label: "합계 계산",
    code: `def main():
    a = 10
    b = 20
    total = a + b
    msg = f"sum={total}"
    print(msg)

if __name__ == "__main__":
    main()`,
  },
  {
    label: "배열 최댓값",
    code: `def main():
    arr = [3, 9, 1, 7]
    max_val = arr[0]
    for i in range(1, len(arr)):
        if arr[i] > max_val:
            max_val = arr[i]
    print(max_val)

if __name__ == "__main__":
    main()`,
  },
  {
    label: "투 포인터",
    code: `def main():
    arr = [1, 2, 4, 7, 11]
    left, right = 0, len(arr) - 1
    target = 9
    while left < right:
        total = arr[left] + arr[right]
        if total == target:
            break
        if total < target:
            left += 1
        else:
            right -= 1
    print(f"{left},{right}")

if __name__ == "__main__":
    main()`,
  },
  {
    label: "피보나치",
    code: `def main():
    n = 7
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    print(b)

if __name__ == "__main__":
    main()`,
  },
];

const TEMPLATES_BY_LANGUAGE: Record<Language, Template[]> = {
  java: JAVA_TEMPLATES,
  python: PYTHON_TEMPLATES,
};

const SUPPORTED_SYNTAX_BY_LANGUAGE: Record<Language, string[]> = {
  java: ["int, String (기본 자료형)", "int[] (배열)", "for / while 루프", "if / else 분기", "System.out.println"],
  python: ["int, str (기본 자료형)", "list (배열)", "for / while 루프", "if / else 분기", "print()"],
};

// ─────────────────────────────────────────────
// Trace generators
// ─────────────────────────────────────────────
function lineOf(lines: string[], pattern: RegExp): number {
  const idx = lines.findIndex((l) => pattern.test(l));
  return idx === -1 ? 1 : idx + 1;
}

function generateTrace(code: string, language: Language): Trace {
  const lines = code.split("\n");
  if (language === "java") {
    if (/int a = 10/.test(code) && /int b = 20/.test(code)) return makeSumTrace(lines, language);
    if (/int\[\] arr = \{3, 9, 1, 7\}/.test(code)) return makeArrayMaxTrace(lines, language);
    if (/int left = 0/.test(code) && /int target/.test(code)) return makeTwoPointerTrace(lines, code, language);
    if (/int n = 7/.test(code) && /a = 0, b = 1/.test(code)) return makeFibTrace(lines, language);
    return makeFallbackTrace(lines, language);
  }

  if (/a = 10/.test(code) && /b = 20/.test(code) && /print\(msg\)/.test(code)) return makeSumTrace(lines, language);
  if (/arr = \[3, 9, 1, 7\]/.test(code)) return makeArrayMaxTrace(lines, language);
  if (/left,\s*right = 0,\s*len\(arr\) - 1/.test(code) && /target =/.test(code)) {
    return makeTwoPointerTrace(lines, code, language);
  }
  if (/n = 7/.test(code) && /a,\s*b = 0,\s*1/.test(code)) return makeFibTrace(lines, language);
  return makeFallbackTrace(lines, language);
}

function makeSumTrace(lines: string[], language: Language): Trace {
  const patterns =
    language === "java"
      ? {
          a: /int a = 10/,
          b: /int b = 20/,
          sum: /int sum = a \+ b/,
          msg: /String msg/,
          print: /System\.out\.println/,
        }
      : {
          a: /a = 10/,
          b: /b = 20/,
          sum: /total = a \+ b/,
          msg: /msg =/,
          print: /print\(msg\)/,
        };

  return {
    title: "합계 계산",
    code: lines.join("\n"),
    language,
    snapshots: [
      { line: lineOf(lines, patterns.a), stack: [{ name: "a", type: "int", value: "10" }], heap: [], output: "", note: "변수 a = 10 초기화" },
      { line: lineOf(lines, patterns.b), stack: [{ name: "a", type: "int", value: "10" }, { name: "b", type: "int", value: "20" }], heap: [], output: "", note: "변수 b = 20 초기화" },
      { line: lineOf(lines, patterns.sum), stack: [{ name: "a", type: "int", value: "10" }, { name: "b", type: "int", value: "20" }, { name: "sum", type: "int", value: "30" }], heap: [], output: "", note: "sum = a + b = 30 계산" },
      { line: lineOf(lines, patterns.msg), stack: [{ name: "a", type: "int", value: "10" }, { name: "b", type: "int", value: "20" }, { name: "sum", type: "int", value: "30" }, { name: "msg", type: "String", value: "-> 0xA1" }], heap: [{ addr: "0xA1", type: "String", value: '"sum=30"' }], output: "", note: "문자열 생성 후 참조값 저장" },
      { line: lineOf(lines, patterns.print), stack: [{ name: "a", type: "int", value: "10" }, { name: "b", type: "int", value: "20" }, { name: "sum", type: "int", value: "30" }, { name: "msg", type: "String", value: "-> 0xA1" }], heap: [{ addr: "0xA1", type: "String", value: '"sum=30"' }], output: "sum=30", note: "출력 완료" },
    ],
  };
}

function makeArrayMaxTrace(lines: string[], language: Language): Trace {
  const patterns =
    language === "java"
      ? {
          arr: /int\[\] arr/,
          max: /int max = arr\[0\]/,
          ifMax: /if \(arr\[i\] > max\)/,
          loop: /for \(int i/,
          print: /System\.out\.println/,
        }
      : {
          arr: /arr = \[/,
          max: /max_val = arr\[0\]/,
          ifMax: /if arr\[i\] > max_val/,
          loop: /for i in range/,
          print: /print\(max_val\)/,
        };

  return {
    title: "배열 최댓값",
    code: lines.join("\n"),
    language,
    snapshots: [
      { line: lineOf(lines, patterns.arr), stack: [{ name: "arr", type: "int[]", value: "-> 0xB1" }], heap: [{ addr: "0xB1", type: "int[]", value: "[3, 9, 1, 7]" }], output: "", note: "배열 생성" },
      { line: lineOf(lines, patterns.max), stack: [{ name: "arr", type: "int[]", value: "-> 0xB1" }, { name: "max", type: "int", value: "3" }], heap: [{ addr: "0xB1", type: "int[]", value: "[3, 9, 1, 7]" }], output: "", note: "max 초기화" },
      { line: lineOf(lines, patterns.ifMax), stack: [{ name: "arr", type: "int[]", value: "-> 0xB1" }, { name: "max", type: "int", value: "9" }, { name: "i", type: "int", value: "1" }], heap: [{ addr: "0xB1", type: "int[]", value: "[3, 9, 1, 7]" }], output: "", note: "i=1에서 max 갱신" },
      { line: lineOf(lines, patterns.loop), stack: [{ name: "arr", type: "int[]", value: "-> 0xB1" }, { name: "max", type: "int", value: "9" }, { name: "i", type: "int", value: "2" }], heap: [{ addr: "0xB1", type: "int[]", value: "[3, 9, 1, 7]" }], output: "", note: "i=2 비교 후 유지" },
      { line: lineOf(lines, patterns.loop), stack: [{ name: "arr", type: "int[]", value: "-> 0xB1" }, { name: "max", type: "int", value: "9" }, { name: "i", type: "int", value: "3" }], heap: [{ addr: "0xB1", type: "int[]", value: "[3, 9, 1, 7]" }], output: "", note: "i=3 비교 후 유지" },
      { line: lineOf(lines, patterns.print), stack: [{ name: "arr", type: "int[]", value: "-> 0xB1" }, { name: "max", type: "int", value: "9" }], heap: [{ addr: "0xB1", type: "int[]", value: "[3, 9, 1, 7]" }], output: "9", note: "최댓값 출력" },
    ],
  };
}

function makeTwoPointerTrace(lines: string[], code: string, language: Language): Trace {
  const arrMatch =
    language === "java"
      ? code.match(/int\[\] arr = \{([^}]+)\}/)
      : code.match(/arr = \[([^\]]+)\]/);
  const targetMatch =
    language === "java" ? code.match(/int target = (\d+)/) : code.match(/target = (\d+)/);
  const rawArr = arrMatch ? arrMatch[1].split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n)) : [1, 2, 4, 7, 11];
  const target = targetMatch ? parseInt(targetMatch[1], 10) : 9;
  const arr = [...rawArr].sort((a, b) => a - b);
  const heap: HeapItem[] = [{ addr: "0xC1", type: "int[]", value: `[${arr.join(", ")}]` }];

  const snaps: Snapshot[] = [];
  let left = 0;
  let right = arr.length - 1;
  const whileLine =
    language === "java"
      ? lineOf(lines, /while \(left < right\)/)
      : lineOf(lines, /while left < right/);
  const sumLine =
    language === "java"
      ? lineOf(lines, /int sum = arr\[left\]/)
      : lineOf(lines, /total = arr\[left\] \+ arr\[right\]/);
  const breakLine = language === "java" ? lineOf(lines, /if \(sum == target\)/) : lineOf(lines, /if total == target/);
  const leftLine = language === "java" ? lineOf(lines, /if \(sum < target\)/) : lineOf(lines, /if total < target/);
  const rightLine = language === "java" ? lineOf(lines, /else right--/) : lineOf(lines, /right -= 1/);
  const printLine = language === "java" ? lineOf(lines, /System\.out\.println/) : lineOf(lines, /print/);

  const initPointerLine =
    language === "java"
      ? lineOf(lines, /int left = 0/)
      : lineOf(lines, /left,\s*right = 0,\s*len\(arr\) - 1/);
  const initTargetLine = language === "java" ? lineOf(lines, /int target/) : lineOf(lines, /target =/);

  snaps.push({ line: initPointerLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xC1" }, { name: "left", type: "int", value: "0" }, { name: "right", type: "int", value: String(right) }], heap, output: "", note: "left=0, right=" + right + " 초기화" });
  snaps.push({ line: initTargetLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xC1" }, { name: "left", type: "int", value: "0" }, { name: "right", type: "int", value: String(right) }, { name: "target", type: "int", value: String(target) }], heap, output: "", note: "target = " + target });

  let found = false;
  let iters = 0;
  void whileLine; // referenced for documentation
  while (left < right && iters++ < arr.length * 2) {
    const total = arr[left] + arr[right];
    snaps.push({ line: sumLine, stack: [{ name: "left", type: "int", value: String(left) }, { name: "right", type: "int", value: String(right) }, { name: "target", type: "int", value: String(target) }, { name: "sum", type: "int", value: String(total) }], heap, output: "", note: `arr[${left}]+arr[${right}] = ${arr[left]}+${arr[right]} = ${total}` });
    if (total === target) {
      found = true;
      snaps.push({ line: breakLine, stack: [{ name: "left", type: "int", value: String(left) }, { name: "right", type: "int", value: String(right) }, { name: "sum", type: "int", value: String(total) }], heap, output: "", note: `${total} == ${target} -> break` });
      break;
    } else if (total < target) {
      snaps.push({ line: leftLine, stack: [{ name: "left", type: "int", value: String(left) }, { name: "right", type: "int", value: String(right) }, { name: "sum", type: "int", value: String(total) }], heap, output: "", note: `${total} < ${target} -> left++` });
      left++;
    } else {
      snaps.push({ line: rightLine, stack: [{ name: "left", type: "int", value: String(left) }, { name: "right", type: "int", value: String(right) }, { name: "sum", type: "int", value: String(total) }], heap, output: "", note: `${total} > ${target} -> right--` });
      right--;
    }
  }
  const outputStr = found ? `${left},${right}` : "-1,-1";
  snaps.push({ line: printLine, stack: [{ name: "left", type: "int", value: String(left) }, { name: "right", type: "int", value: String(right) }], heap, output: outputStr, note: found ? `인덱스 (${left}, ${right}): 값 ${arr[left]}, ${arr[right]}` : "답 없음 → -1,-1" });
  return { title: "투 포인터", code: lines.join("\n"), snapshots: snaps, language };
}

function makeFibTrace(lines: string[], language: Language): Trace {
  const patterns =
    language === "java"
      ? {
          n: /int n = 7/,
          init: /int a = 0/,
          loop: /int tmp = a \+ b/,
          print: /System\.out\.println/,
        }
      : {
          n: /n = 7/,
          init: /a,\s*b = 0,\s*1/,
          loop: /a,\s*b = b,\s*a \+ b/,
          print: /print\(b\)/,
        };

  return {
    title: "피보나치",
    code: lines.join("\n"),
    language,
    snapshots: [
      { line: lineOf(lines, patterns.n), stack: [{ name: "n", type: "int", value: "7" }], heap: [], output: "", note: "n = 7 설정" },
      { line: lineOf(lines, patterns.init), stack: [{ name: "n", type: "int", value: "7" }, { name: "a", type: "int", value: "0" }, { name: "b", type: "int", value: "1" }], heap: [], output: "", note: "a,b 초기화" },
      { line: lineOf(lines, patterns.loop), stack: [{ name: "n", type: "int", value: "7" }, { name: "a", type: "int", value: "0" }, { name: "b", type: "int", value: "1" }, { name: "i", type: "int", value: "2" }], heap: [], output: "", note: "반복 1회 진행" },
      { line: lineOf(lines, patterns.loop), stack: [{ name: "n", type: "int", value: "7" }, { name: "a", type: "int", value: "1" }, { name: "b", type: "int", value: "2" }, { name: "i", type: "int", value: "3" }], heap: [], output: "", note: "반복 2회 진행" },
      { line: lineOf(lines, patterns.loop), stack: [{ name: "n", type: "int", value: "7" }, { name: "a", type: "int", value: "2" }, { name: "b", type: "int", value: "3" }, { name: "i", type: "int", value: "4" }], heap: [], output: "", note: "반복 3회 진행" },
      { line: lineOf(lines, patterns.loop), stack: [{ name: "n", type: "int", value: "7" }, { name: "a", type: "int", value: "5" }, { name: "b", type: "int", value: "8" }, { name: "i", type: "int", value: "6" }], heap: [], output: "", note: "반복 5회 진행" },
      { line: lineOf(lines, patterns.loop), stack: [{ name: "n", type: "int", value: "7" }, { name: "a", type: "int", value: "8" }, { name: "b", type: "int", value: "13" }, { name: "i", type: "int", value: "7" }], heap: [], output: "", note: "반복 종료 직전" },
      { line: lineOf(lines, patterns.print), stack: [{ name: "n", type: "int", value: "7" }, { name: "a", type: "int", value: "8" }, { name: "b", type: "int", value: "13" }], heap: [], output: "13", note: "F(7)=13 출력" },
    ],
  };
}

function makeFallbackTrace(lines: string[], language: Language): Trace {
  return {
    title: "코드 실행",
    code: lines.join("\n"),
    language,
    snapshots: [
      { line: 1, stack: [], heap: [], output: "", note: "실행 시작" },
      { line: Math.ceil(lines.length / 2), stack: [{ name: "...", type: "...", value: "..." }], heap: [], output: "", note: "중간 지점" },
      { line: lines.length, stack: [], heap: [], output: "// 완료", note: "실행 종료" },
    ],
  };
}

// ─────────────────────────────────────────────
// VS Code-like window chrome wrapper
// ─────────────────────────────────────────────
function VsCodeWindow({
  fileName,
  language,
  lineCount,
  children,
}: {
  fileName: string;
  language: string;
  lineCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 shadow-2xl" style={{ background: "#1e1e1e" }}>
      {/* Title bar */}
      <div
        className="flex h-9 items-center gap-0 border-b px-3"
        style={{ background: "#323233", borderColor: "rgba(255,255,255,0.08)" }}
      >
        {/* Mac traffic lights */}
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
          <span className="h-3 w-3 rounded-full" style={{ background: "#febc2e" }} />
          <span className="h-3 w-3 rounded-full" style={{ background: "#28c840" }} />
        </div>
        {/* Window title */}
        <span className="flex-1 text-center text-[12px] text-slate-400">{fileName}</span>
        <div className="w-10" />
      </div>

      {/* Tab bar */}
      <div
        className="flex items-end border-b"
        style={{ background: "#2d2d2d", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-center gap-2 border-r border-t border-white/[0.08] px-4 py-1.5"
          style={{ background: "#1e1e1e", borderTopColor: "#3B82F6" }}
        >
          {/* Java icon dot */}
          <span className="h-2 w-2 rounded-full bg-orange-400/80" />
          <span className="text-[12px] text-slate-200">{fileName}</span>
          <span
            className="ml-1 flex h-4 w-4 items-center justify-center rounded-sm text-[10px] text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
            title="닫기"
          >
            ✕
          </span>
        </div>
        <div className="flex-1" />
      </div>

      {/* Editor content */}
      <div className="flex-1">{children}</div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-0.5 text-[11px]"
        style={{ background: "#3B82F6" }}
      >
        <div className="flex items-center gap-3 text-white/80">
          <span>⑂ main</span>
          <span>⚠ 0</span>
        </div>
        <div className="flex items-center gap-4 text-white/80">
          <span>Ln {lineCount}</span>
          <span>UTF-8</span>
          <span>{language}</span>
          <span>CodeFlow</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export function TestLab() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("java");
  const templates = TEMPLATES_BY_LANGUAGE[selectedLanguage];
  const [phase, setPhase] = useState<"editor" | "visualizer">("editor");
  const [editorCode, setEditorCode] = useState(TEMPLATES_BY_LANGUAGE.java[0].code);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [activeTemplate, setActiveTemplate] = useState(0);

  // Visualizer state
  const [snapshotIndex, setSnapshotIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(750);
  const codeRef = useRef<HTMLDivElement>(null);

  const maxIndex = (trace?.snapshots.length ?? 1) - 1;
  const currentSnapshot = trace?.snapshots[snapshotIndex] ?? null;
  const progress = trace ? ((snapshotIndex + 1) / trace.snapshots.length) * 100 : 0;
  const isFinished = snapshotIndex >= maxIndex;
  const succeeded = isFinished && (currentSnapshot?.output.length ?? 0) > 0 && currentSnapshot?.output !== "-1,-1";
  const failed = isFinished && ((currentSnapshot?.output.length ?? 0) === 0 || currentSnapshot?.output === "-1,-1");

  const lineCount = editorCode.split("\n").length;
  const MONACO_LINE_HEIGHT = 20;
  const editorHeight = Math.min(920, Math.max(220, lineCount * MONACO_LINE_HEIGHT + 24));
  const languageLabel = selectedLanguage === "java" ? "Java" : "Python";
  const fileName = selectedLanguage === "java" ? "Main.java" : "main.py";

  useEffect(() => {
    const nextTemplates = TEMPLATES_BY_LANGUAGE[selectedLanguage];
    setActiveTemplate(0);
    setEditorCode(nextTemplates[0].code);
    setTrace(null);
    setPhase("editor");
    setIsRunning(false);
    setSnapshotIndex(0);
  }, [selectedLanguage]);

  useEffect(() => {
    if (!isRunning || !trace) return;
    if (snapshotIndex >= maxIndex) { setIsRunning(false); return; }
    const id = window.setTimeout(() => setSnapshotIndex((p) => Math.min(p + 1, maxIndex)), speed);
    return () => window.clearTimeout(id);
  }, [isRunning, snapshotIndex, maxIndex, speed, trace]);

  useEffect(() => {
    if (!codeRef.current) return;
    const el = codeRef.current.querySelector("[data-active='true']") as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [snapshotIndex]);

  const handleSubmit = () => {
    const generated = generateTrace(editorCode, selectedLanguage);
    setTrace(generated);
    setSnapshotIndex(0);
    setIsRunning(false);
    setPhase("visualizer");
  };

  const handleEditCode = () => {
    setIsRunning(false);
    setPhase("editor");
    // editorCode is preserved — user can edit and resubmit
  };

  // ── EDITOR PHASE ─────────────────────────────
  if (phase === "editor") {
    return (
      <main className="flex min-h-screen flex-col bg-bg text-slate-50">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-bg/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-8">
            <Link href="/" className="text-sm text-slate-400 transition hover:text-white">
              ← 메인
            </Link>
            <span className="text-sm font-semibold tracking-wide text-blue">CodeFlow · Study</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedLanguage("java")}
                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition ${
                  selectedLanguage === "java"
                    ? "border-orange-400/30 bg-orange-400/10 text-orange-300"
                    : "border-white/15 text-slate-400 hover:border-white/30 hover:text-slate-200"
                }`}
              >
                Java
              </button>
              <button
                onClick={() => setSelectedLanguage("python")}
                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition ${
                  selectedLanguage === "python"
                    ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
                    : "border-white/15 text-slate-400 hover:border-white/30 hover:text-slate-200"
                }`}
              >
                Python
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-6 sm:px-8 lg:flex-row">
          {/* ── Editor column ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {/* Template tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] text-slate-500">템플릿</span>
              {templates.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() => {
                    setActiveTemplate(i);
                    setEditorCode(t.code);
                  }}
                  className={`rounded-md border px-3 py-1 text-xs transition ${
                    activeTemplate === i
                      ? "border-blue/50 bg-blue/10 text-blue"
                      : "border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* VS Code-like window */}
            <VsCodeWindow fileName={fileName} language={languageLabel} lineCount={lineCount}>
              <div style={{ height: `${editorHeight}px` }}>
                <MonacoEditor
                  height="100%"
                  language={selectedLanguage}
                  value={editorCode}
                  onChange={(val) => setEditorCode(val ?? "")}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    lineHeight: MONACO_LINE_HEIGHT,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    roundedSelection: true,
                    padding: { top: 8, bottom: 8 },
                    tabSize: 2,
                    cursorBlinking: "smooth",
                    smoothScrolling: true,
                    automaticLayout: true,
                    contextmenu: true,
                    renderLineHighlight: "all",
                    bracketPairColorization: { enabled: true },
                  }}
                />
              </div>
            </VsCodeWindow>
          </div>

          {/* ── Right sidebar ── */}
          <div className="flex w-full flex-col gap-4 lg:w-64">
            {/* How it works */}
            <div className="rounded-2xl border border-white/10 bg-bg2/70 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-blue">사용 방법</p>
              <ol className="mt-3 space-y-3">
                <li className="flex gap-2.5 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue/20 text-[10px] font-bold text-blue">1</span>
                  <span className="min-w-0 leading-6">템플릿 선택 또는 직접 코드 작성</span>
                </li>
                <li className="flex gap-2.5 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue/20 text-[10px] font-bold text-blue">2</span>
                  <span className="min-w-0 leading-6">
                    <strong className="text-white">제출</strong>을 눌러 분석 시작
                  </span>
                </li>
                <li className="flex gap-2.5 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue/20 text-[10px] font-bold text-blue">3</span>
                  <span className="min-w-0 leading-6">Stack / Heap / Output 시각화 확인</span>
                </li>
                <li className="flex gap-2.5 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue/20 text-[10px] font-bold text-blue">4</span>
                  <span className="min-w-0 leading-6">
                    시각화 중 <strong className="text-white">코드 수정</strong>으로 돌아와 재제출
                  </span>
                </li>
              </ol>
            </div>

            {/* Supported syntax */}
            <div className="rounded-2xl border border-white/10 bg-bg2/70 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">지원 문법</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-400">
                {SUPPORTED_SYNTAX_BY_LANGUAGE[selectedLanguage].map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <span className="text-blue/60">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="rounded-xl bg-gradient-to-r from-blue to-purple px-6 py-3.5 text-sm font-bold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98]"
            >
              ▶ 제출 및 시각화
            </button>

            {/* If we have a previous trace, show re-submit hint */}
            {trace && (
              <p className="text-center text-[11px] text-slate-600">
                이전: <span className="text-slate-500">{trace.title}</span> · 코드를 수정하고 다시 제출하세요
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── VISUALIZER PHASE ─────────────────────────
  if (!trace || !currentSnapshot) return null;
  const codeLines = trace.code.split("\n");
  const traceLangLabel = trace.language === "java" ? "Java" : "Python";
  const traceFileName = trace.language === "java" ? "Main.java" : "main.py";

  return (
    <main className="min-h-screen bg-bg text-slate-50">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-8">
          <button
            onClick={handleEditCode}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 transition hover:border-blue/50 hover:text-white"
          >
            ✏ 코드 수정
          </button>
          <span className="text-sm font-semibold tracking-wide text-blue">CodeFlow · Visualizer</span>
          <span className="text-xs text-slate-500">
            {snapshotIndex + 1} / {trace.snapshots.length}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        {/* Control bar */}
        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-bg2/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-white">{trace.title}</h1>
              {isFinished && (
                <span
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    succeeded
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                      : failed
                        ? "border-red-500/40 bg-red-500/15 text-red-400"
                        : "border-blue/40 bg-blue/15 text-blue"
                  }`}
                >
                  {succeeded ? "✓ 정답" : failed ? "✗ 실패" : "● 완료"}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Step {snapshotIndex + 1} / {trace.snapshots.length} — {currentSnapshot.note}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsRunning((p) => !p)}
              disabled={isFinished && !isRunning}
              className="rounded-lg bg-gradient-to-r from-blue to-purple px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isRunning ? "⏸ 일시정지" : "▶ 실행"}
            </button>
            <button
              onClick={() => { setIsRunning(false); setSnapshotIndex((p) => Math.min(p + 1, maxIndex)); }}
              disabled={isFinished}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:border-blue/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              스텝 →
            </button>
            <button
              onClick={() => { setIsRunning(false); setSnapshotIndex(0); }}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:border-white/40 hover:text-white"
            >
              ↩ 리셋
            </button>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue focus:outline-none"
            >
              <option value={1200}>🐢 느림</option>
              <option value={750}>🚶 보통</option>
              <option value={350}>🏃 빠름</option>
            </select>

            {/* 완료 후 코드 수정 유도 버튼 */}
            {isFinished && (
              <button
                onClick={handleEditCode}
                className="rounded-lg border border-blue/40 bg-blue/10 px-4 py-2 text-sm font-semibold text-blue transition hover:bg-blue/20"
              >
                ✏ 코드 수정 후 재제출
              </button>
            )}
          </div>
        </div>

        {/* Panels */}
        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Code viewer (VS Code-like) */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 shadow-xl" style={{ background: "#1e1e1e" }}>
            {/* Title bar */}
            <div className="flex h-8 items-center border-b px-3" style={{ background: "#323233", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#febc2e" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28c840" }} />
              </div>
              <span className="flex-1 text-center text-[11px] text-slate-500">{traceFileName} — 시각화 모드</span>
            </div>
            {/* Tab */}
            <div className="flex border-b" style={{ background: "#2d2d2d", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 border-t border-white/[0.08] px-4 py-1" style={{ background: "#1e1e1e", borderTopColor: "#3B82F6" }}>
                <span className="h-2 w-2 rounded-full bg-orange-400/80" />
                <span className="text-[12px] text-slate-200">{traceFileName}</span>
                <span className="ml-0.5 rounded-full bg-blue/30 px-1.5 py-0.5 text-[10px] text-blue">
                  Step {snapshotIndex + 1}
                </span>
              </div>
            </div>

            {/* Code lines */}
            <div ref={codeRef} className="flex-1 overflow-auto px-0 py-2 font-mono text-sm" style={{ maxHeight: "440px", background: "#1e1e1e" }}>
              {codeLines.map((line, idx) => {
                const lineNo = idx + 1;
                const isActive = lineNo === currentSnapshot.line;
                return (
                  <div
                    key={lineNo}
                    data-active={isActive ? "true" : "false"}
                    className="flex items-start transition-colors duration-150"
                    style={{
                      background: isActive ? "rgba(59,130,246,0.12)" : undefined,
                      borderLeft: isActive ? "2px solid #3B82F6" : "2px solid transparent",
                    }}
                  >
                    <span
                      className="w-12 shrink-0 select-none py-0.5 pr-4 text-right text-[12px]"
                      style={{ color: isActive ? "#6b9bd2" : "#4a5568" }}
                    >
                      {lineNo}
                    </span>
                    <span className="w-5 shrink-0 py-0.5 text-center text-[11px] text-blue">
                      {isActive ? "▶" : ""}
                    </span>
                    <span
                      className="flex-1 whitespace-pre py-0.5 pr-4 leading-6"
                      style={{ color: isActive ? "#e2e8f0" : "#9ca3af" }}
                    >
                      {line}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress + status bar */}
            <div className="border-t border-white/[0.06] px-4 py-2.5" style={{ background: "#252526" }}>
              <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
                <span>진행률</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-blue to-purple transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-0.5 text-[11px]" style={{ background: "#3B82F6" }}>
              <span className="text-white/80">⑂ main</span>
              <div className="flex items-center gap-4 text-white/80">
                <span>Ln {currentSnapshot.line}</span>
                <span>{traceLangLabel}</span>
                <span>CodeFlow</span>
              </div>
            </div>
          </div>

          {/* Side panels */}
          <section className="flex flex-col gap-3">
            {/* Step note */}
            <div className="rounded-2xl border border-white/10 bg-bg2/75 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Step Note</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{currentSnapshot.note}</p>
              {isFinished && (
                <div className={`mt-3 rounded-lg border px-3 py-2 ${succeeded ? "border-emerald-500/30 bg-emerald-500/10" : failed ? "border-red-500/30 bg-red-500/10" : "border-blue/30 bg-blue/10"}`}>
                  <p className={`text-xs font-semibold ${succeeded ? "text-emerald-400" : failed ? "text-red-400" : "text-blue"}`}>
                    {succeeded ? "✓ 정답 출력" : failed ? "✗ 해 없음" : "● 실행 완료"}
                  </p>
                  {(currentSnapshot.output.length > 0) && (
                    <p className="mt-1 font-mono text-sm text-cyan">{currentSnapshot.output}</p>
                  )}
                </div>
              )}
            </div>

            {/* Stack */}
            <div className="rounded-2xl border border-white/10 bg-bg2/75 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Stack</p>
              <div className="mt-2.5 space-y-1.5">
                {currentSnapshot.stack.length === 0 ? (
                  <p className="text-xs text-slate-600">비어 있음</p>
                ) : (
                  currentSnapshot.stack.map((v, i) => (
                    <div key={`${v.name}-${i}`} className="flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs">
                      <span className="w-16 shrink-0 font-semibold text-blue">{v.name}</span>
                      <span className="w-14 shrink-0 text-slate-500">{v.type}</span>
                      <span className="truncate font-mono text-slate-200">{v.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Heap */}
            <div className="rounded-2xl border border-white/10 bg-bg2/75 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Heap</p>
              <div className="mt-2.5 space-y-1.5">
                {currentSnapshot.heap.length === 0 ? (
                  <p className="text-xs text-slate-600">힙 객체 없음</p>
                ) : (
                  currentSnapshot.heap.map((h) => (
                    <div key={h.addr} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs">
                      <p className="font-mono text-[10px] text-slate-500">{h.addr} · {h.type}</p>
                      <p className="mt-0.5 font-mono text-slate-200">{h.value}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Output */}
            <div className="rounded-2xl border border-white/10 bg-bg2/75 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Output</p>
              <div className="mt-2.5 rounded-lg border border-white/[0.07] bg-black/30 px-3 py-2.5">
                <p className="font-mono text-sm text-cyan">
                  {currentSnapshot.output.length > 0
                    ? currentSnapshot.output
                    : <span className="text-slate-600">(출력 없음)</span>}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
