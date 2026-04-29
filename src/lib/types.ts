// ============================================================
// 全局类型契约 — 前后端共用
// ============================================================

export type ModuleId = "basic" | "context" | "mbti" | "holland" | "values" | "dimensions";

export interface BasicInfo {
  name: string;
  age: number;
  gender?: "男" | "女" | "其他";
}

export type EducationLevel =
  | "高中在读" | "高中毕业"
  | "大学在读" | "大学毕业"
  | "硕士在读" | "硕士毕业"
  | "博士在读" | "博士毕业";

export type CareerStage =
  | "在校探索" | "应届求职" | "在职稳定"
  | "考虑转型" | "主动创业" | "自由职业"
  | "待业" | "退休返聘";

export type TargetLocation =
  | "一线（北上广深）" | "新一线（杭州/成都/武汉等）"
  | "二线" | "三四线" | "海外" | "远程" | "不限";

export interface Context {
  educationLevel?: EducationLevel;
  school?: string;
  major?: string;
  graduationYear?: number;
  workYears?: number;
  currentIndustry?: string;
  currentRole?: string;
  careerStage?: CareerStage;
  targetLocation?: TargetLocation;
  incomeFloor?: number;
  incomeTarget?: number;
  constraints?: string;
}

// 量表答题：questionId -> 1..5（李克特）或 0/1（二选一）
export type QuizAnswers = Record<string, number>;

export interface Dimensions {
  passion: string;
  strength: string;
  demand: string;
  value: string;
}

// 完整用户输入（前端 store + 后端 D1 共用）
export interface AssessmentProfile {
  sessionId: string;
  createdAt: number;
  updatedAt: number;
  basic?: BasicInfo;
  context?: Context;
  mbtiAnswers?: QuizAnswers;
  hollandAnswers?: QuizAnswers;
  valuesAnswers?: QuizAnswers;
  dimensions?: Dimensions;
  completed: ModuleId[];
}

// 题目类型
export type LikertScale = 1 | 2 | 3 | 4 | 5;

export interface QuizQuestion {
  id: string;
  text: string;
  // MBTI: dimension 标记题目所属维度（"EI" / "SN" / "TF" / "JP"）+ 方向（哪边是 E/I）
  // Holland: type 标记 RIASEC
  // Values: dim 标记舒伯 14 维之一
  meta: Record<string, string>;
}

export interface ModuleMeta {
  id: ModuleId;
  title: string;
  subtitle: string;
  questionsCount: number; // 0 = 表单/自述类
  estimatedMinutes: number;
  route: string;
  order: number;
}
