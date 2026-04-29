import { useEffect, useState } from "react";
import { store } from "../lib/store";
import type { Dimensions } from "../lib/types";

const MIN_CHARS = 150;

const FIELDS: { key: keyof Dimensions; icon: string; label: string; placeholder: string }[] = [
  {
    key: "passion",
    icon: "💖",
    label: "择己所爱（兴趣与热情）",
    placeholder: "什么活动 / 主题让你感到有内驱力、能进入心流？详细说说你最想做、做了不嫌累的事..."
  },
  {
    key: "strength",
    icon: "💪",
    label: "择己所长（技能与优势）",
    placeholder: "你最强的硬技能与软技能是什么？举一两个具体成就案例（项目/作品/事件），不要泛泛而谈..."
  },
  {
    key: "demand",
    icon: "🌍",
    label: "择世所需（社会需求与趋势）",
    placeholder: "你观察到社会 / 产业有哪些重要趋势或问题想解决？哪些领域你觉得未来 5-10 年值得投入..."
  },
  {
    key: "value",
    icon: "💰",
    label: "择己所利（个人与财务目标）",
    placeholder: "你对收入、生活方式、职业发展有什么期待？理想的工作日常 / 五年后的画像 / 不愿妥协的底线..."
  }
];

export default function DimensionsForm() {
  const [data, setData] = useState<Partial<Dimensions>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = store.load();
    if (p?.dimensions) setData(p.dimensions);
  }, []);

  const counts = FIELDS.map((f) => ({
    key: f.key,
    chars: (data[f.key] ?? "").trim().length,
    ok: (data[f.key] ?? "").trim().length >= MIN_CHARS
  }));
  const allOk = counts.every((c) => c.ok);
  const passedCount = counts.filter((c) => c.ok).length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!allOk) {
      const remaining = counts.filter((c) => !c.ok).map((c) => FIELDS.find((f) => f.key === c.key)?.label).join(" / ");
      setError(`还有 ${4 - passedCount} 段未达 ${MIN_CHARS} 字：${remaining}`);
      return;
    }

    store.completeModule("dimensions", "dimensions", {
      passion: data.passion!.trim(),
      strength: data.strength!.trim(),
      demand: data.demand!.trim(),
      value: data.value!.trim()
    });
    window.location.assign("/finish");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <p className="text-sm text-gray-600 -mt-6 leading-relaxed">
        这 4 段是 AI 写出深度报告的关键 — 比所有量表加起来都重要。
        每段 <span className="font-semibold">≥ {MIN_CHARS} 字</span>，无上限。可随时切换补充。
      </p>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
          <div
            className="bg-gray-900 h-1 transition-all duration-300"
            style={{ width: `${(passedCount / 4) * 100}%` }}
          />
        </div>
        <span>{passedCount} / 4 段达标</span>
      </div>

      {FIELDS.map((f) => {
        const value = data[f.key] ?? "";
        const chars = value.trim().length;
        const ok = chars >= MIN_CHARS;
        return (
          <div key={f.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{f.icon}</span>
              <h2 className="text-lg font-medium text-gray-900">{f.label}</h2>
            </div>
            <textarea
              value={value}
              onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              rows={6}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:bg-white focus:border-gray-900 text-base leading-relaxed resize-y"
            />
            <div className="flex items-center justify-between text-xs">
              <span className={ok ? "text-gray-900 font-medium" : "text-gray-400"}>
                {ok ? "✓ 已达标" : `还差 ${MIN_CHARS - chars} 字`}
              </span>
              <span className="text-gray-400">{chars} / ≥ {MIN_CHARS} 字</span>
            </div>
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="pt-6 flex items-center justify-between border-t border-gray-100">
        <a href="/assess/values" className="text-sm text-gray-500 hover:text-gray-900">← 返回上一模块</a>
        <button
          type="submit"
          disabled={!allOk}
          className="px-10 py-4 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          完成测评 →
        </button>
      </div>
    </form>
  );
}
