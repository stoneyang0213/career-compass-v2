import { useEffect, useState } from "react";
import { store } from "../lib/store";
import { nextModule } from "../lib/modules";
import type { ModuleId, QuizQuestion, QuizAnswers, AssessmentProfile } from "../lib/types";

const LIKERT_OPTIONS = [
  { value: 1, label: "非常不符合" },
  { value: 2, label: "不太符合" },
  { value: 3, label: "中立 / 不一定" },
  { value: 4, label: "比较符合" },
  { value: 5, label: "非常符合" }
];

interface Props {
  moduleId: ModuleId;
  questions: QuizQuestion[];
  storeField: keyof AssessmentProfile; // "mbtiAnswers" | "hollandAnswers" | "valuesAnswers"
  /** 完成时计算预览（如 MBTI 类型 / 霍兰德代码），传给 ModuleOutro */
  computePreview?: (answers: QuizAnswers, questions: QuizQuestion[]) => string;
  /** 模块开场介绍文案（可选） */
  intro?: { title: string; lines: string[] };
}

export default function QuizShell({ moduleId, questions, storeField, computePreview, intro }: Props) {
  type Phase = "intro" | "quiz" | "outro";
  const [phase, setPhase] = useState<Phase>(intro ? "intro" : "quiz");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  // hydrate
  useEffect(() => {
    const p = store.load();
    const saved = p?.[storeField] as QuizAnswers | undefined;
    if (saved && Object.keys(saved).length > 0) {
      setAnswers(saved);
      // 进度恢复到第一个未答的题
      const firstUnansweredIdx = questions.findIndex((q) => saved[q.id] == null);
      setIndex(firstUnansweredIdx === -1 ? questions.length - 1 : firstUnansweredIdx);
      setPhase("quiz"); // 已经填过部分，跳过 intro
    }
  }, []);

  const current = questions[index];
  const total = questions.length;
  const answered = Object.keys(answers).length;

  function pick(value: number) {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    // 自动延迟 220ms 进入下一题（让用户感知到选中）
    setTimeout(() => {
      if (index < total - 1) {
        setIndex(index + 1);
      } else {
        // 全部完成 → 写入 store + 进 outro
        store.completeModule(moduleId, storeField, next as never);
        setPhase("outro");
      }
    }, 220);
  }

  function back() {
    if (index > 0) setIndex(index - 1);
  }

  function goNextModule() {
    const next = nextModule(moduleId);
    window.location.assign(next?.route ?? "/");
  }

  if (phase === "intro" && intro) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-semibold text-gray-900">{intro.title}</h2>
        <ul className="space-y-2 text-base text-gray-700 leading-relaxed">
          {intro.lines.map((l, i) => <li key={i}>· {l}</li>)}
        </ul>
        <p className="text-sm text-gray-500">本节共 {total} 题，建议你找个不被打扰的环境，倒杯水。</p>
        <button
          onClick={() => setPhase("quiz")}
          className="px-10 py-4 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition"
        >
          开始作答 →
        </button>
      </div>
    );
  }

  if (phase === "outro") {
    const preview = computePreview?.(answers, questions);
    return (
      <div className="space-y-8 text-center pt-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-gray-900 flex items-center justify-center text-white text-2xl">
          ✓
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">本节已完成</h2>
          <p className="text-sm text-gray-500">{total} 题作答记录已保存</p>
        </div>
        {preview && (
          <div className="inline-block px-8 py-6 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="text-xs tracking-widest text-gray-500 uppercase mb-2">初步分析</p>
            <p className="text-3xl font-semibold text-gray-900 tracking-wider">{preview}</p>
            <p className="text-xs text-gray-500 mt-3">完整解读将在生成报告时给出</p>
          </div>
        )}
        <button
          onClick={goNextModule}
          className="px-10 py-4 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition"
        >
          继续下一模块 →
        </button>
      </div>
    );
  }

  // phase === "quiz"
  const picked = answers[current.id];
  const percentInModule = Math.round(((index) / total) * 100);

  return (
    <div className="space-y-12">
      {/* 子进度 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>第 {index + 1} / {total} 题</span>
        <span>{answered} / {total} 已答</span>
      </div>
      <div className="bg-gray-100 rounded-full h-1 -mt-8 overflow-hidden">
        <div className="bg-gray-900 h-1 transition-all duration-300" style={{ width: `${percentInModule}%` }} />
      </div>

      {/* 题面 */}
      <h2 className="text-2xl md:text-3xl font-medium text-gray-900 leading-relaxed pt-4 min-h-[6rem]">
        {current.text}
      </h2>

      {/* 选项 */}
      <div className="space-y-3">
        {LIKERT_OPTIONS.map((opt) => {
          const isPicked = picked === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => pick(opt.value)}
              className={`w-full px-6 py-4 text-left rounded-2xl border-2 transition text-base ${
                isPicked
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              <span className="inline-block w-6 mr-3 text-center text-sm opacity-60">{opt.value}</span>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 底部导航 */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
        <button
          onClick={back}
          disabled={index === 0}
          className="text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← 上一题
        </button>
        <span className="text-xs text-gray-400">点击选项后会自动进入下一题</span>
      </div>
    </div>
  );
}
