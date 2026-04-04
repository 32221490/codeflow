import Link from "next/link";
import { VisualizerPreview } from "@/components/VisualizerPreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-28 sm:px-8 sm:pb-24 sm:pt-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-6rem] h-[26rem] w-[26rem] -translate-x-1/2 animate-drift-y rounded-full bg-blue/15 blur-3xl" />
        <div className="absolute right-[-6rem] top-40 h-72 w-72 animate-drift-x rounded-full bg-purple/15 blur-3xl" />
        <div className="absolute left-[-5rem] top-64 h-64 w-64 animate-drift-y rounded-full bg-cyan/10 blur-3xl" />
        <div className="absolute inset-0 animate-drift-x bg-hero-grid bg-[size:60px_60px] opacity-[0.06]" />
        <svg
          className="absolute inset-0 h-full w-full animate-drift-x opacity-40"
          viewBox="0 0 1440 900"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M-100 300C200 180 400 180 700 300C1000 420 1200 420 1540 300"
            stroke="#3B82F6"
            strokeWidth="80"
            opacity="0.08"
          />
          <path
            d="M-100 450C200 330 400 330 700 450C1000 570 1200 570 1540 450"
            stroke="#8B5CF6"
            strokeWidth="60"
            opacity="0.08"
          />
          <path
            d="M-100 150C200 30 400 30 700 150C1000 270 1200 270 1540 150"
            stroke="#06B6D4"
            strokeWidth="40"
            opacity="0.06"
          />
        </svg>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center">
        <div className="max-w-4xl text-center">
          <div className="reveal-up inline-flex items-center gap-2 rounded-full border border-blue/30 bg-blue/10 px-4 py-2 text-xs font-medium text-blue">
            <span className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-blue" />
            {"// visual debugging for learning"}
          </div>

          <h1 className="reveal-up reveal-delay-1 mt-7 text-4xl font-bold leading-tight tracking-[-0.06em] text-slate-50 sm:text-6xl">
            코드의 <span className="text-gradient">실행 과정</span>을
            <br />
            눈으로 이해하세요
          </h1>

          <p className="reveal-up reveal-delay-2 mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            결과가 아닌 과정을 봅니다. 코드가 실행될 때 Stack과 Heap이 어떻게 변화하는지
            실시간으로 시각화합니다.
          </p>

          <div className="reveal-up reveal-delay-3 mt-10 w-full max-w-3xl">
            <form
              action="/study"
              method="get"
              className="panel-border flex flex-col gap-3 rounded-2xl bg-bg2/70 p-3 backdrop-blur sm:flex-row sm:items-center"
            >
              <input
                type="text"
                name="prompt"
                placeholder="원하는 문제 분야를 입력해보세요. 예) 투 포인터 입문 문제"
                className="h-12 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue/60 focus:ring-2 focus:ring-blue/20"
              />
              <button
                type="submit"
                className="h-12 rounded-xl bg-gradient-to-r from-blue to-purple px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90"
              >
                AI 문제 만들기
              </button>
            </form>
            <div className="mt-3 text-center">
              <Link
                href="/study"
                className="text-sm text-slate-400 underline decoration-slate-700 underline-offset-4 transition hover:text-slate-200 hover:decoration-slate-500"
              >
                또는 단계별 문제로 시작하기 →
              </Link>
            </div>
          </div>
        </div>

        <div className="reveal-up reveal-delay-4 mt-16 w-full animate-float">
          <VisualizerPreview />
        </div>
      </div>
    </section>
  );
}
