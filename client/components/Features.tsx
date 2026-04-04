const features = [
  {
    icon: "🧠",
    title: "라인별 실행 시각화",
    description: "코드가 한 줄씩 실행될 때 무슨 일이 일어나는지 단계별로 추적합니다.",
    tone: "bg-blue/10 text-blue",
  },
  {
    icon: "📦",
    title: "Stack / Heap 시각화",
    description: "변수와 객체가 메모리에서 어떻게 저장되고 참조되는지 보여줍니다.",
    tone: "bg-cyan/10 text-cyan",
  },
  {
    icon: "🔁",
    title: "재귀 흐름 시각화",
    description: "Call Stack 구조를 시각적으로 표현해 재귀 함수의 동작을 이해합니다.",
    tone: "bg-purple/10 text-purple",
  },
  {
    icon: "🎯",
    title: "포인터 / 배열 시각화",
    description: "투포인터와 배열 인덱스 이동을 화살표로 직관적으로 표현합니다.",
    tone: "bg-indigo-400/10 text-indigo-300",
  },
  {
    icon: "▶",
    title: "Step 실행 모드",
    description: "한 줄씩 수동으로 실행하며 각 단계에서의 상태를 직접 확인합니다.",
    tone: "bg-emerald-400/10 text-emerald-300",
  },
  {
    icon: "⚠",
    title: "에러 위치 강조",
    description: "오류가 발생한 정확한 라인과 원인을 시각적으로 즉시 파악합니다.",
    tone: "bg-rose-400/10 text-rose-300",
  },
];

export function Features() {
  return (
    <section id="features" className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="reveal-up max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue">
            {"// features"}
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">왜 CodeFlow인가요?</h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            복잡한 디버거 없이, 코드가 어떻게 동작하는지 직관적으로 이해합니다.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="reveal-up group panel-border rounded-2xl bg-bg2/70 p-6 transition duration-300 hover:-translate-y-2 hover:border-blue/35 hover:bg-white/[0.05] hover:shadow-[0_18px_45px_rgba(15,23,42,0.45)]"
              style={{ animationDelay: `${0.08 + index * 0.08}s` }}
            >
              <div
                className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl text-xl transition duration-300 group-hover:scale-110 group-hover:shadow-[0_0_28px_rgba(59,130,246,0.16)] ${feature.tone}`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white transition duration-300 group-hover:text-slate-50">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300 transition duration-300 group-hover:text-slate-200">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
