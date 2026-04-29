import QuizShell from "./QuizShell";
import questions from "../data/questions/mbti.json";
import type { QuizQuestion, QuizAnswers } from "../lib/types";

const OPPOSITE: Record<string, string> = {
  E: "I", I: "E", S: "N", N: "S", T: "F", F: "T", J: "P", P: "J"
};

/** 简单 MBTI 计分（mock 12 题版；Step 5 会移到 lib/scoring.ts 并对接 60 题真题） */
function computeMBTI(answers: QuizAnswers, qs: QuizQuestion[]): string {
  const sums: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  for (const q of qs) {
    const score = answers[q.id];
    if (!score) continue;
    const side = q.meta.side;
    const opp = OPPOSITE[side];
    if (score >= 4) sums[side] += score - 3;
    else if (score <= 2) sums[opp] += 3 - score;
  }
  const ei = sums.E >= sums.I ? "E" : "I";
  const sn = sums.S >= sums.N ? "S" : "N";
  const tf = sums.T >= sums.F ? "T" : "F";
  const jp = sums.J >= sums.P ? "J" : "P";
  return ei + sn + tf + jp;
}

export default function MBTIQuiz() {
  return (
    <QuizShell
      moduleId="mbti"
      questions={questions as QuizQuestion[]}
      storeField="mbtiAnswers"
      computePreview={computeMBTI}
      intro={{
        title: "性格类型测评",
        lines: [
          "本节基于经典人格类型理论改编，共 12 题（v1 mock，正式版 60 题）",
          "每题给出一句陈述，请按「非常不符合 → 非常符合」5 级回答你的真实感受",
          "没有「对错」，请凭直觉作答，不要纠结",
          "测评结果将作为 AI 生成职业规划报告的核心输入之一"
        ]
      }}
    />
  );
}
