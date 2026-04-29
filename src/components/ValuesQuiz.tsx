import QuizShell from "./QuizShell";
import questions from "../data/questions/values.json";
import type { QuizQuestion, QuizAnswers } from "../lib/types";

function computeValues(answers: QuizAnswers, qs: QuizQuestion[]): string {
  const sums: Record<string, number> = {};
  for (const q of qs) {
    const dim = q.meta.dim;
    sums[dim] = (sums[dim] ?? 0) + (answers[q.id] ?? 0);
  }
  const top3 = Object.entries(sums)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([dim]) => dim);
  return top3.join(" · ");
}

export default function ValuesQuiz() {
  return (
    <QuizShell
      moduleId="values"
      questions={questions as QuizQuestion[]}
      storeField="valuesAnswers"
      computePreview={computeValues}
      intro={{
        title: "职业价值观测评（舒伯 WVI 改编）",
        lines: [
          "本节基于经典职业价值观理论改编，共 15 题（v1 mock，正式版 45 题）",
          "每题描述工作中可能重视的一个维度，请评估你「多重视」这一项",
          "结果会列出你最看重的 3 个价值维度，影响 AI 推荐的工作环境画像",
          "如生活方式 / 同事关系 / 经济报酬 / 创造发明 等"
        ]
      }}
    />
  );
}
