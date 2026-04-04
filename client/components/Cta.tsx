import Link from "next/link";

export function Cta() {
  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-24">
      <div className="absolute inset-0 -z-10 animate-pulseSoft bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.14),transparent_45%)]" />

      <div className="reveal-up mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-14 text-center backdrop-blur sm:px-10">
        <h2 className="text-3xl font-bold text-white sm:text-5xl">
          코드를 <span className="text-gradient-soft">눈으로</span> 이해하세요
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300">
          결과가 아닌 과정을 보는 것, 그것이 진짜 학습입니다.
        </p>
        <Link
          href="/study"
          className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-blue to-purple px-7 py-3.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:opacity-90"
        >
          ▶ 무료로 시작하기
        </Link>
      </div>
    </section>
  );
}
