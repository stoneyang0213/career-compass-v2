import QuizShell from "./QuizShell";
import questions from "../data/questions/holland.json";
import type { QuizQuestion, QuizAnswers } from "../lib/types";

const TYPE_NAME: Record<string, string> = {
  R: "实际型", I: "研究型", A: "艺术型", S: "社会型", E: "企业型", C: "常规型"
};

function computeHolland(answers: QuizAnswers, qs: QuizQuestion[]): string {
  const sums: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const q of qs) {
    const score = answers[q.id];
    if (!score) continue;
    sums[q.meta.type] += score;
  }
  return Object.entries(sums)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([code]) => code)
    .join("");
}

export default function HollandQuiz() {
  return (
    <QuizShell
      moduleId="holland"
      questions={questions as QuizQuestion[]}
      storeField="hollandAnswers"
      computePreview={computeHolland}
      intro={{
        title: "职业兴趣测评（霍兰德 RIASEC 改编）",
        lines: [
          "本节基于经典职业兴趣理论改编，共 12 题（v1 mock，正式版 60 题）",
          "每题给出一种活动或工作场景，请回答你「多喜欢」做这件事",
          "结果会给出三字代码（如 ASI），代表你最强的 3 个职业兴趣维度",
          "6 个维度：R 实际型 / I 研究型 / A 艺术型 / S 社会型 / E 企业型 / C 常规型"
        ]
      }}
    />
  );
}
