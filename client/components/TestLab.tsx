"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

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
type TestCase = { input: string; expected: string };
type TestResult = { input: string; expected: string; actual: string; passed: boolean };
type Problem = {
  title: string;
  difficulty: "입문" | "초급" | "중급" | "상급";
  description: string;
  inputFormat: string;
  outputFormat: string;
  examples: TestCase[];
  constraints: string[];
};

// ─────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────
const JAVA_TEMPLATES: Template[] = [
  {
    label: "선형 탐색",
    code: `public class Main {
  public static void main(String[] args) {
    int[] arr = {4, 2, 7, 1, 9};
    int target = 7;
    int index = -1;
    for (int i = 0; i < arr.length; i++) {
      if (arr[i] == target) {
        index = i;
        break;
      }
    }
    System.out.println(index);
  }
}`,
  },
  {
    label: "버블 정렬",
    code: `public class Main {
  public static void main(String[] args) {
    int[] arr = {5, 3, 1, 4};
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
      for (int j = 0; j < n - 1 - i; j++) {
        if (arr[j] > arr[j + 1]) {
          int tmp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = tmp;
        }
      }
    }
    System.out.println(arr[0] + "," + arr[1] + "," + arr[2] + "," + arr[3]);
  }
}`,
  },
  {
    label: "팩토리얼",
    code: `public class Main {
  static int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  }
  public static void main(String[] args) {
    int result = factorial(5);
    System.out.println(result);
  }
}`,
  },
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
    label: "선형 탐색",
    code: `def main():
    arr = [4, 2, 7, 1, 9]
    target = 7
    index = -1
    for i in range(len(arr)):
        if arr[i] == target:
            index = i
            break
    print(index)

if __name__ == "__main__":
    main()`,
  },
  {
    label: "버블 정렬",
    code: `def main():
    arr = [5, 3, 1, 4]
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    print(",".join(map(str, arr)))

if __name__ == "__main__":
    main()`,
  },
  {
    label: "팩토리얼",
    code: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def main():
    result = factorial(5)
    print(result)

if __name__ == "__main__":
    main()`,
  },
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
  java: ["int, String (기본 자료형)", "int[] (배열)", "for / while 루프", "if / else 분기", "재귀 함수 (콜스택)", "swap (tmp 변수)", "System.out.println"],
  python: ["int, str (기본 자료형)", "list (배열)", "for / while 루프", "if / else 분기", "재귀 함수 (콜스택)", "print()"],
};

// ─────────────────────────────────────────────
// Dummy problem & test results
// ─────────────────────────────────────────────
const DUMMY_PROBLEM: Problem = {
  title: "배열의 최댓값",
  difficulty: "초급",
  description:
    "N개의 정수로 이루어진 배열이 주어진다. 배열에서 가장 큰 수를 찾아 출력하시오.",
  inputFormat:
    "첫째 줄에 배열의 크기 N이 주어진다.\n둘째 줄에 N개의 정수가 공백으로 구분되어 주어진다.",
  outputFormat: "배열에서 가장 큰 수를 출력한다.",
  examples: [
    { input: "4\n3 9 1 7", expected: "9" },
    { input: "5\n-1 -5 -3 -2 -4", expected: "-1" },
    { input: "3\n42 42 42", expected: "42" },
  ],
  constraints: ["1 ≤ N ≤ 100", "−1,000 ≤ 배열 원소 ≤ 1,000"],
};

const DUMMY_TEST_RESULTS: TestResult[] = [
  { input: "4\n3 9 1 7",     expected: "9",  actual: "9",  passed: true  },
  { input: "5\n-1 -5 -3 -2 -4", expected: "-1", actual: "-1", passed: true  },
  { input: "3\n42 42 42",    expected: "42", actual: "0",  passed: false },
];

const DIFFICULTY_COLOR: Record<Problem["difficulty"], string> = {
  입문: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  초급: "border-blue/40 bg-blue/10 text-blue",
  중급: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  상급: "border-red-500/40 bg-red-500/10 text-red-400",
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
    if (/int\[\] arr = \{4, 2, 7, 1, 9\}/.test(code) && /int target = 7/.test(code)) return makeLinearSearchTrace(lines, language);
    if (/int\[\] arr = \{5, 3, 1, 4\}/.test(code) && /int tmp = arr\[j\]/.test(code)) return makeBubbleSortTrace(lines, language);
    if (/static int factorial/.test(code) && /factorial\(5\)/.test(code)) return makeFactorialTrace(lines, language);
    if (/int a = 10/.test(code) && /int b = 20/.test(code)) return makeSumTrace(lines, language);
    if (/int\[\] arr = \{3, 9, 1, 7\}/.test(code)) return makeArrayMaxTrace(lines, language);
    if (/int left = 0/.test(code) && /int target/.test(code)) return makeTwoPointerTrace(lines, code, language);
    if (/int n = 7/.test(code) && /a = 0, b = 1/.test(code)) return makeFibTrace(lines, language);
    return makeFallbackTrace(lines, language);
  }

  if (/arr = \[4, 2, 7, 1, 9\]/.test(code) && /target = 7/.test(code)) return makeLinearSearchTrace(lines, language);
  if (/arr = \[5, 3, 1, 4\]/.test(code) && /arr\[j\], arr\[j \+ 1\]/.test(code)) return makeBubbleSortTrace(lines, language);
  if (/def factorial/.test(code) && /factorial\(5\)/.test(code)) return makeFactorialTrace(lines, language);
  if (/a = 10/.test(code) && /b = 20/.test(code) && /print\(msg\)/.test(code)) return makeSumTrace(lines, language);
  if (/arr = \[3, 9, 1, 7\]/.test(code)) return makeArrayMaxTrace(lines, language);
  if (/left,\s*right = 0,\s*len\(arr\) - 1/.test(code) && /target =/.test(code)) return makeTwoPointerTrace(lines, code, language);
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

function makeLinearSearchTrace(lines: string[], language: Language): Trace {
  const heap: HeapItem[] = [{ addr: "0xD1", type: "int[]", value: "[4, 2, 7, 1, 9]" }];
  const arr = [4, 2, 7, 1, 9];
  const target = 7;
  const arrLine = lineOf(lines, language === "java" ? /int\[\] arr/ : /arr = \[/);
  const targetLine = lineOf(lines, language === "java" ? /int target = 7/ : /target = 7/);
  const indexLine = lineOf(lines, language === "java" ? /int index = -1/ : /index = -1/);
  const loopLine = lineOf(lines, language === "java" ? /for \(int i/ : /for i in range/);
  const ifLine = lineOf(lines, language === "java" ? /if \(arr\[i\] == target\)/ : /if arr\[i\] == target/);
  const printLine = lineOf(lines, language === "java" ? /System\.out\.println/ : /print\(index\)/);

  const snaps: Snapshot[] = [
    { line: arrLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xD1" }], heap, output: "", note: "배열 [4, 2, 7, 1, 9] 생성" },
    { line: targetLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xD1" }, { name: "target", type: "int", value: "7" }], heap, output: "", note: "target = 7 설정" },
    { line: indexLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xD1" }, { name: "target", type: "int", value: "7" }, { name: "index", type: "int", value: "-1" }], heap, output: "", note: "index = -1 초기화 (못 찾은 상태)" },
  ];

  for (let i = 0; i < arr.length; i++) {
    snaps.push({ line: loopLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xD1" }, { name: "target", type: "int", value: "7" }, { name: "index", type: "int", value: "-1" }, { name: "i", type: "int", value: String(i) }], heap, output: "", note: `i=${i} 순회 중, arr[${i}]=${arr[i]}` });
    snaps.push({ line: ifLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xD1" }, { name: "target", type: "int", value: "7" }, { name: "index", type: "int", value: i === 2 ? "2" : "-1" }, { name: "i", type: "int", value: String(i) }], heap, output: "", note: `arr[${i}](${arr[i]}) == ${target} ? ${arr[i] === target ? "✅ 찾음 → break" : "❌"}` });
    if (arr[i] === target) break;
  }

  snaps.push({ line: printLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xD1" }, { name: "target", type: "int", value: "7" }, { name: "index", type: "int", value: "2" }], heap, output: "2", note: "index=2 출력 (arr[2]=7)" });
  return { title: "선형 탐색", code: lines.join("\n"), snapshots: snaps, language };
}

function makeBubbleSortTrace(lines: string[], language: Language): Trace {
  const arr = [5, 3, 1, 4];
  const outerLine = lineOf(lines, language === "java" ? /for \(int i = 0/ : /for i in range\(n - 1\)/);
  const innerLine = lineOf(lines, language === "java" ? /for \(int j = 0/ : /for j in range\(n - 1 - i\)/);
  const ifLine = lineOf(lines, language === "java" ? /if \(arr\[j\] > arr\[j \+ 1\]\)/ : /if arr\[j\] > arr\[j \+ 1\]/);
  const swapLine = lineOf(lines, language === "java" ? /int tmp = arr\[j\]/ : /arr\[j\], arr\[j \+ 1\]/);
  const printLine = lineOf(lines, language === "java" ? /System\.out\.println/ : /print\("/);

  const snaps: Snapshot[] = [];
  const a = [...arr];

  snaps.push({ line: outerLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xE1" }, { name: "n", type: "int", value: "4" }], heap: [{ addr: "0xE1", type: "int[]", value: `[${a.join(", ")}]` }], output: "", note: `정렬 시작: [${a.join(", ")}]` });

  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      snaps.push({ line: innerLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xE1" }, { name: "i", type: "int", value: String(i) }, { name: "j", type: "int", value: String(j) }], heap: [{ addr: "0xE1", type: "int[]", value: `[${a.join(", ")}]` }], output: "", note: `i=${i}, j=${j} 비교: arr[${j}]=${a[j]} vs arr[${j + 1}]=${a[j + 1]}` });
      snaps.push({ line: ifLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xE1" }, { name: "i", type: "int", value: String(i) }, { name: "j", type: "int", value: String(j) }], heap: [{ addr: "0xE1", type: "int[]", value: `[${a.join(", ")}]` }], output: "", note: `${a[j]} > ${a[j + 1]} ? ${a[j] > a[j + 1] ? "✅ swap" : "❌ 유지"}` });
      if (a[j] > a[j + 1]) {
        const tmp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = tmp;
        snaps.push({ line: swapLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xE1" }, { name: "i", type: "int", value: String(i) }, { name: "j", type: "int", value: String(j) }, { name: "tmp", type: "int", value: String(tmp) }], heap: [{ addr: "0xE1", type: "int[]", value: `[${a.join(", ")}]` }], output: "", note: `swap → [${a.join(", ")}]` });
      }
    }
  }

  snaps.push({ line: printLine, stack: [{ name: "arr", type: "int[]", value: "-> 0xE1" }], heap: [{ addr: "0xE1", type: "int[]", value: `[${a.join(", ")}]` }], output: a.join(","), note: `정렬 완료: [${a.join(", ")}]` });
  return { title: "버블 정렬", code: lines.join("\n"), snapshots: snaps, language };
}

function makeFactorialTrace(lines: string[], language: Language): Trace {
  const baseLine = lineOf(lines, language === "java" ? /if \(n <= 1\)/ : /if n <= 1/);
  const returnRecLine = lineOf(lines, language === "java" ? /return n \* factorial/ : /return n \* factorial/);
  const mainCallLine = lineOf(lines, language === "java" ? /int result = factorial\(5\)/ : /result = factorial\(5\)/);
  const printLine = lineOf(lines, language === "java" ? /System\.out\.println/ : /print\(result\)/);

  const snaps: Snapshot[] = [
    { line: mainCallLine, stack: [{ name: "[main]", type: "frame", value: "result=?" }], heap: [], output: "", note: "factorial(5) 호출" },
    { line: returnRecLine, stack: [{ name: "[main]", type: "frame", value: "result=?" }, { name: "[factorial]", type: "frame", value: "n=5" }], heap: [], output: "", note: "factorial(5) → 5 * factorial(4)" },
    { line: returnRecLine, stack: [{ name: "[main]", type: "frame", value: "result=?" }, { name: "[factorial]", type: "frame", value: "n=5" }, { name: "[factorial]", type: "frame", value: "n=4" }], heap: [], output: "", note: "factorial(4) → 4 * factorial(3)" },
    { line: returnRecLine, stack: [{ name: "[main]", type: "frame", value: "result=?" }, { name: "[factorial]", type: "frame", value: "n=5" }, { name: "[factorial]", type: "frame", value: "n=4" }, { name: "[factorial]", type: "frame", value: "n=3" }], heap: [], output: "", note: "factorial(3) → 3 * factorial(2)" },
    { line: returnRecLine, stack: [{ name: "[main]", type: "frame", value: "result=?" }, { name: "[factorial]", type: "frame", value: "n=5" }, { name: "[factorial]", type: "frame", value: "n=4" }, { name: "[factorial]", type: "frame", value: "n=3" }, { name: "[factorial]", type: "frame", value: "n=2" }], heap: [], output: "", note: "factorial(2) → 2 * factorial(1)" },
    { line: baseLine, stack: [{ name: "[main]", type: "frame", value: "result=?" }, { name: "[factorial]", type: "frame", value: "n=5" }, { name: "[factorial]", type: "frame", value: "n=4" }, { name: "[factorial]", type: "frame", value: "n=3" }, { name: "[factorial]", type: "frame", value: "n=2" }, { name: "[factorial]", type: "frame", value: "n=1" }], heap: [], output: "", note: "n=1 → base case: return 1" },
    { line: returnRecLine, stack: [{ name: "[main]", type: "frame", value: "result=?" }, { name: "[factorial]", type: "frame", value: "n=5" }, { name: "[factorial]", type: "frame", value: "n=4" }, { name: "[factorial]", type: "frame", value: "n=3" }, { name: "[factorial]", type: "frame", value: "n=2 → return 2" }], heap: [], output: "", note: "factorial(2) = 2 * 1 = 2 반환" },
    { line: returnRecLine, stack: [{ name: "[main]", type: "frame", value: "result=?" }, { name: "[factorial]", type: "frame", value: "n=5" }, { name: "[factorial]", type: "frame", value: "n=4" }, { name: "[factorial]", type: "frame", value: "n=3 → return 6" }], heap: [], output: "", note: "factorial(3) = 3 * 2 = 6 반환" },
    { line: returnRecLine, stack: [{ name: "[main]", type: "frame", value: "result=?" }, { name: "[factorial]", type: "frame", value: "n=5" }, { name: "[factorial]", type: "frame", value: "n=4 → return 24" }], heap: [], output: "", note: "factorial(4) = 4 * 6 = 24 반환" },
    { line: returnRecLine, stack: [{ name: "[main]", type: "frame", value: "result=?" }, { name: "[factorial]", type: "frame", value: "n=5 → return 120" }], heap: [], output: "", note: "factorial(5) = 5 * 24 = 120 반환" },
    { line: printLine, stack: [{ name: "[main]", type: "frame", value: "result=120" }], heap: [], output: "120", note: "result=120 출력" },
  ];

  return { title: "팩토리얼 (재귀)", code: lines.join("\n"), snapshots: snaps, language };
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
  const searchParams = useSearchParams();
  const studyType = searchParams.get("studyType") ?? "";
  const isAlgorithm = studyType === "알고리즘";

  const [selectedLanguage, setSelectedLanguage] = useState<Language>("java");
  const templates = TEMPLATES_BY_LANGUAGE[selectedLanguage];
  const [phase, setPhase] = useState<"editor" | "loading" | "result">("editor");
  const [editorCode, setEditorCode] = useState(TEMPLATES_BY_LANGUAGE.java[0].code);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [activeTemplate, setActiveTemplate] = useState(0);

  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

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
  const editorHeight = Math.min(920, Math.max(500, lineCount * MONACO_LINE_HEIGHT + 24));
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
    setTestResults(null);
  }, [selectedLanguage]);

  // loading → result transition
  useEffect(() => {
    if (phase !== "loading") return;
    const id = window.setTimeout(() => {
      if (!isAlgorithm) {
        const generated = generateTrace(editorCode, selectedLanguage);
        setTrace(generated);
        setSnapshotIndex(0);
        setIsRunning(false);
      }
      setTestResults(DUMMY_TEST_RESULTS);
      setPhase("result");
    }, 1500);
    return () => window.clearTimeout(id);
  }, [phase, editorCode, selectedLanguage, isAlgorithm]);

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
    setPhase("loading");
  };

  const handleEditCode = () => {
    setIsRunning(false);
    setPhase("editor");
    setTestResults(null);
  };

  // ── LOADING PHASE ────────────────────────────
  if (phase === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg text-slate-50">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue opacity-25" />
          <span className="relative inline-flex h-10 w-10 rounded-full bg-gradient-to-br from-blue to-purple" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">채점 중…</p>
          <p className="mt-1 text-sm text-slate-400">테스트 케이스를 실행하고 있습니다</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-blue/60"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </main>
    );
  }

  // ── EDITOR PHASE ─────────────────────────────
  if (phase === "editor") {
    return (
      <main className="flex min-h-screen flex-col bg-bg text-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-bg/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-8">
            <Link href="/" className="text-sm text-slate-400 transition hover:text-white">← 메인</Link>
            <span className="text-sm font-semibold tracking-wide text-blue">CodeFlow · Study</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedLanguage("java")}
                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition ${selectedLanguage === "java" ? "border-orange-400/30 bg-orange-400/10 text-orange-300" : "border-white/15 text-slate-400 hover:border-white/30 hover:text-slate-200"}`}
              >Java</button>
              <button
                onClick={() => setSelectedLanguage("python")}
                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition ${selectedLanguage === "python" ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300" : "border-white/15 text-slate-400 hover:border-white/30 hover:text-slate-200"}`}
              >Python</button>
            </div>
          </div>
        </header>

        {/* Two-column layout */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-6 sm:px-8 lg:flex-row">

          {/* ── LEFT: Problem Panel ── */}
          <aside className="w-full shrink-0 lg:sticky lg:top-[56px] lg:h-[calc(100vh-56px)] lg:w-[400px] lg:overflow-y-auto">
            <div className="flex flex-col gap-3 pb-6">

              {/* Title & description */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_COLOR[DUMMY_PROBLEM.difficulty]}`}>
                    {DUMMY_PROBLEM.difficulty}
                  </span>
                </div>
                <h1 className="text-lg font-bold text-white">{DUMMY_PROBLEM.title}</h1>
                <p className="mt-3 text-sm leading-7 text-slate-300">{DUMMY_PROBLEM.description}</p>
              </div>

              {/* Input / Output format */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">입력</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{DUMMY_PROBLEM.inputFormat}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500">출력</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{DUMMY_PROBLEM.outputFormat}</p>
              </div>

              {/* Examples */}
              {DUMMY_PROBLEM.examples.map((ex, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">예제 {i + 1}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="mb-1 text-[10px] font-medium text-slate-500">입력</p>
                      <pre className="rounded-lg bg-black/30 px-3 py-2 font-mono text-xs leading-5 text-slate-200">{ex.input}</pre>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-medium text-slate-500">출력</p>
                      <pre className="rounded-lg bg-black/30 px-3 py-2 font-mono text-xs leading-5 text-slate-200">{ex.expected}</pre>
                    </div>
                  </div>
                </div>
              ))}

              {/* Constraints */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">제한</p>
                <ul className="mt-2 space-y-1.5">
                  {DUMMY_PROBLEM.constraints.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="mt-1 shrink-0 text-blue/60">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* ── RIGHT: Editor Panel ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">

            {/* Template tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] text-slate-500">템플릿</span>
              {templates.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() => { setActiveTemplate(i); setEditorCode(t.code); setTestResults(null); }}
                  className={`rounded-md border px-3 py-1 text-xs transition ${activeTemplate === i ? "border-blue/50 bg-blue/10 text-blue" : "border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Monaco Editor */}
            <VsCodeWindow fileName={fileName} language={languageLabel} lineCount={lineCount}>
              <div style={{ height: `${editorHeight}px` }}>
                <MonacoEditor
                  height="100%"
                  language={selectedLanguage}
                  value={editorCode}
                  onChange={(val) => { setEditorCode(val ?? ""); setTestResults(null); }}
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

            {/* Action button */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSubmit}
                className="rounded-xl bg-gradient-to-r from-blue to-purple px-6 py-3 text-sm font-bold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98]"
              >
                ▶ 실행 및 채점
              </button>
            </div>

            {/* Supported syntax */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">지원 문법</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                {SUPPORTED_SYNTAX_BY_LANGUAGE[selectedLanguage].map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <span className="text-blue/60">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── RESULT PHASE ─────────────────────────────
  const passCount = testResults ? testResults.filter((r) => r.passed).length : 0;
  const totalCount = testResults ? testResults.length : 0;

  // 알고리즘 모드: 채점 결과 + 제출 코드 표시
  if (isAlgorithm) {
    const algoLineCount = editorCode.split("\n").length;
    const algoEditorHeight = Math.min(600, Math.max(300, algoLineCount * MONACO_LINE_HEIGHT + 24));

    return (
      <main className="flex min-h-screen flex-col bg-bg text-slate-50">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-bg/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-8">
            <button
              onClick={handleEditCode}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 transition hover:border-blue/50 hover:text-white"
            >
              ✏ 코드 수정
            </button>
            <span className="text-sm font-semibold tracking-wide text-blue">CodeFlow · 채점 결과</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
              passCount === totalCount
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : passCount === 0
                ? "border-red-500/40 bg-red-500/10 text-red-400"
                : "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
            }`}>
              {passCount} / {totalCount} 통과
            </span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row">

            {/* ── 왼쪽: 제출 코드 ── */}
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">제출 코드</p>
              <VsCodeWindow fileName={fileName} language={languageLabel} lineCount={algoLineCount}>
                <div style={{ height: `${algoEditorHeight}px` }}>
                  <MonacoEditor
                    height="100%"
                    language={selectedLanguage}
                    value={editorCode}
                    theme="vs-dark"
                    options={{
                      fontSize: 14,
                      lineHeight: MONACO_LINE_HEIGHT,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbers: "on",
                      readOnly: true,
                      padding: { top: 8, bottom: 8 },
                      tabSize: 2,
                      automaticLayout: true,
                      renderLineHighlight: "none",
                    }}
                  />
                </div>
              </VsCodeWindow>

              <div className="mt-4 flex justify-start">
                <button
                  onClick={handleEditCode}
                  className="rounded-xl bg-gradient-to-r from-blue to-purple px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:opacity-90"
                >
                  ✏ 코드 수정 후 재제출
                </button>
              </div>
            </div>

            {/* ── 오른쪽: 테스트 케이스 결과 ── */}
            <div className="w-full lg:w-[380px] lg:shrink-0">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">테스트 결과</p>
              {testResults && (
                <div className="flex flex-col gap-3">
                  {testResults.map((r, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl border p-4 ${
                        r.passed
                          ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                          : "border-red-500/25 bg-red-500/[0.06]"
                      }`}
                    >
                      <p className={`mb-3 text-xs font-bold ${r.passed ? "text-emerald-400" : "text-red-400"}`}>
                        {r.passed ? "✓" : "✗"} 테스트 {i + 1}
                      </p>
                      <div className="flex flex-col gap-2 text-[11px]">
                        <div>
                          <p className="mb-1 text-slate-500">입력</p>
                          <pre className="whitespace-pre-wrap rounded-lg bg-black/30 px-2.5 py-2 font-mono leading-5 text-slate-200">{r.input}</pre>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="mb-1 text-slate-500">기댓값</p>
                            <pre className="rounded-lg bg-black/30 px-2.5 py-2 font-mono text-slate-200">{r.expected}</pre>
                          </div>
                          <div>
                            <p className="mb-1 text-slate-500">실제 출력</p>
                            <pre className={`rounded-lg px-2.5 py-2 font-mono ${
                              r.passed ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
                            }`}>{r.actual}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    );
  }

  // 언어 개념 모드: 채점 결과 + 시각화
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

        {/* ── Test Results ── */}
        {testResults && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            {/* Header row */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-white">채점 결과</p>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                  passCount === totalCount
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : passCount === 0
                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                    : "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                }`}>
                  {passCount === totalCount ? "✓" : passCount === 0 ? "✗" : "△"} {passCount} / {totalCount} 통과
                </span>
              </div>
              <button
                onClick={handleEditCode}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-300 transition hover:border-blue/40 hover:text-white"
              >
                ✏ 코드 수정
              </button>
            </div>

            {/* Per-test cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              {testResults.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-3.5 ${
                    r.passed
                      ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                      : "border-red-500/25 bg-red-500/[0.06]"
                  }`}
                >
                  <p className={`mb-3 text-xs font-bold ${r.passed ? "text-emerald-400" : "text-red-400"}`}>
                    {r.passed ? "✓" : "✗"} 테스트 {i + 1}
                  </p>
                  <div className="flex flex-col gap-2 text-[11px]">
                    <div>
                      <p className="mb-1 text-slate-500">입력</p>
                      <pre className="whitespace-pre-wrap rounded-lg bg-black/30 px-2.5 py-1.5 font-mono leading-5 text-slate-200">{r.input}</pre>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="mb-1 text-slate-500">기댓값</p>
                        <pre className="rounded-lg bg-black/30 px-2.5 py-1.5 font-mono text-slate-200">{r.expected}</pre>
                      </div>
                      <div>
                        <p className="mb-1 text-slate-500">실제 출력</p>
                        <pre className={`rounded-lg px-2.5 py-1.5 font-mono ${
                          r.passed
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-red-500/10 text-red-300"
                        }`}>{r.actual}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Control bar */}
        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-bg2/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-white">{trace.title}</h1>
              {isFinished && (
                <span
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${succeeded
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
