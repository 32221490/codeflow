const codeLines = [
  { line: 1, content: <>public class <span className="text-[#82AAFF]">Main</span> {"{"}</>, state: "done" },
  {
    line: 2,
    content: (
      <>
        {"  "}public static void <span className="text-[#82AAFF]">main</span>(String[] args) {"{"}
      </>
    ),
    state: "done",
  },
  {
    line: 3,
    content: (
      <>
        {"    "}int x = <span className="text-[#F78C6C]">10</span>;
      </>
    ),
    state: "done",
  },
  {
    line: 4,
    content: (
      <>
        {"    "}int y = <span className="text-[#F78C6C]">20</span>;
      </>
    ),
    state: "done",
  },
  {
    line: 5,
    content: (
      <>
        {"    "}String name = new <span className="text-[#82AAFF]">String</span>(
        <span className="text-[#C3E88D]">&quot;CodeFlow&quot;</span>);
      </>
    ),
    state: "active",
  },
  { line: 6, content: <>{"    "}int result = x + y;</>, state: "idle" },
  {
    line: 7,
    content: (
      <>
        {"    "}System.out.<span className="text-[#82AAFF]">println</span>(result);
      </>
    ),
    state: "idle",
  },
  { line: 8, content: <>{"  "}{"}"}</>, state: "idle" },
  { line: 9, content: <>{"}"}</>, state: "idle" },
];

const stackVars = [
  { name: "x", type: "int", value: "10" },
  { name: "y", type: "int", value: "20" },
  { name: "name", type: "String", value: "→ 0x1a2b", highlight: true },
];

export function VisualizerPreview() {
  return (
    <div
      id="visualizer"
      className="panel-border w-full max-w-5xl overflow-hidden rounded-3xl bg-bg2/85 shadow-glow transition-transform duration-500 hover:-translate-y-1"
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57] transition-transform duration-300 hover:scale-110" />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E] transition-transform duration-300 hover:scale-110" />
          <span className="h-3 w-3 rounded-full bg-[#28C840] transition-transform duration-300 hover:scale-110" />
        </div>
        <span className="text-xs text-slate-500 sm:text-sm">
          Main.java - CodeFlow Visualizer
        </span>
        <span className="hidden text-xs font-medium text-cyan sm:inline">SSE 연결됨</span>
      </div>

      <div className="grid min-h-[360px] gap-px bg-white/10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="bg-bg2 px-5 py-6 font-mono text-xs text-slate-300 sm:px-6 sm:text-sm">
          {codeLines.map((item) => (
            <div
              key={item.line}
              className={[
                "mb-1 flex items-center gap-3 rounded-md px-3 py-2 transition duration-500",
                item.state === "done" ? "opacity-50" : "",
                item.state === "active"
                  ? "border-l-2 border-blue bg-blue/10 opacity-100 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.12)]"
                  : "bg-transparent",
              ].join(" ")}
              style={{ animationDelay: `${item.line * 60}ms` }}
            >
              <span className="w-5 text-right text-[11px] text-slate-500">{item.line}</span>
              {item.state === "active" ? (
                <span className="animate-pulseSoft text-blue">▶</span>
              ) : (
                <span className="w-3" />
              )}
              <span className="whitespace-pre-wrap leading-7">{item.content}</span>
            </div>
          ))}
        </div>

        <div className="space-y-6 bg-[#0f172a] px-5 py-6 sm:px-6">
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
              Stack - Local Variables
            </p>
            <div className="space-y-2">
              {stackVars.map((variable) => (
                <div
                  key={variable.name}
                  className={[
                    "flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm transition-transform duration-300 hover:translate-x-1",
                    variable.highlight ? "border border-blue/30" : "border border-transparent",
                  ].join(" ")}
                >
                  <span className="min-w-12 text-[#82AAFF]">{variable.name}</span>
                  <span className="min-w-14 text-xs text-slate-500">{variable.type}</span>
                  <span className={variable.highlight ? "text-purple" : "font-medium text-[#F78C6C]"}>
                    {variable.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
              Heap - Objects
            </p>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm transition-transform duration-300 hover:translate-x-1">
              <p className="text-xs text-slate-500">0x1a2b · String</p>
              <p className="mt-2 text-slate-100">&quot;CodeFlow&quot;</p>
            </div>
          </section>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 bg-black/20 px-5 py-3 text-xs text-slate-400 sm:px-6">
        <span className="h-2 w-2 animate-pulseSoft rounded-full bg-blue" />
        <span>라인 5 실행 중 · 스냅샷 수신</span>
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-blue to-purple" />
          <div className="absolute inset-y-0 left-0 w-16 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
        <span>5 / 9</span>
      </div>
    </div>
  );
}
