import type { ModuleMeta, ModuleId } from "./types";

export const MODULES: ModuleMeta[] = [
  { id: "basic", title: "基本信息", subtitle: "姓名 / 年龄 / 性别", questionsCount: 3, estimatedMinutes: 1, route: "/assess/basic", order: 1 },
  { id: "context", title: "当前情境", subtitle: "教育 / 工作 / 地域 / 约束", questionsCount: 12, estimatedMinutes: 4, route: "/assess/context", order: 2 },
  { id: "mbti", title: "性格类型测评", subtitle: "60 题 · 基于经典理论改编", questionsCount: 60, estimatedMinutes: 12, route: "/assess/mbti", order: 3 },
  { id: "holland", title: "职业兴趣测评", subtitle: "60 题 · 基于经典理论改编", questionsCount: 60, estimatedMinutes: 12, route: "/assess/holland", order: 4 },
  { id: "values", title: "职业价值观测评", subtitle: "45 题 · 基于经典理论改编", questionsCount: 45, estimatedMinutes: 9, route: "/assess/values", order: 5 },
  { id: "dimensions", title: "四维深度自述", subtitle: "爱 / 长 / 需 / 利 · 每段 ≥150 字", questionsCount: 4, estimatedMinutes: 8, route: "/assess/dimensions", order: 6 }
];

export function nextModule(current: ModuleId): ModuleMeta | null {
  const i = MODULES.findIndex((m) => m.id === current);
  return i >= 0 && i < MODULES.length - 1 ? MODULES[i + 1] : null;
}

export function moduleById(id: ModuleId): ModuleMeta | undefined {
  return MODULES.find((m) => m.id === id);
}

export const TOTAL_QUESTIONS = MODULES.reduce((sum, m) => sum + m.questionsCount, 0);
export const TOTAL_MINUTES = MODULES.reduce((sum, m) => sum + m.estimatedMinutes, 0);
