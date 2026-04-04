const steps = [
  "코드 작성",
  "Docker 실행",
  "JDI 상태 추출",
  "SSE 전송",
  "실시간 시각화",
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-white/10 px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl text-center">
        <p className="reveal-up text-xs font-semibold uppercase tracking-[0.35em] text-blue">
          {"// how it works"}
        </p>
        <h2 className="reveal-up reveal-delay-1 mt-4 text-3xl font-semibold text-white sm:text-4xl">
          이렇게 동작합니다
        </h2>
        <p className="reveal-up reveal-delay-2 mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
          실행 엔진이 코드 상태를 스냅샷으로 추출하고, 프론트엔드가 그 흐름을 학습 친화적인
          시각 언어로 바꿔줍니다.
        </p>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3 lg:flex-nowrap">
          {steps.map((step, index) => (
            <div key={step} className="contents">
              <div
                className="reveal-up group flex min-w-[130px] flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 transition duration-300 hover:-translate-y-2 hover:border-blue/35 hover:bg-white/[0.05] hover:shadow-[0_18px_45px_rgba(15,23,42,0.45)]"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue to-purple text-sm font-bold text-white shadow-[0_0_24px_rgba(59,130,246,0.25)] transition duration-300 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-slate-300 transition duration-300 group-hover:text-white">
                  {step}
                </p>
              </div>
              {index < steps.length - 1 ? (
                <span
                  className="reveal-up px-1 text-xl text-slate-600 lg:px-2"
                  style={{ animationDelay: `${0.24 + index * 0.1}s` }}
                >
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
