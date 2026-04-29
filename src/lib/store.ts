// ============================================================
// 客户端 store · localStorage 实现（v1）
// 后续 Step 4 接通后端 API 后改为：localStorage 同步 + 后端 D1 持久化
// ============================================================

import type { AssessmentProfile, ModuleId } from "./types";

const STORAGE_KEY = "career-compass-v2-progress";

function emptyProfile(sessionId: string): AssessmentProfile {
  const now = Date.now();
  return {
    sessionId,
    createdAt: now,
    updatedAt: now,
    completed: []
  };
}

function newSessionId(): string {
  // 浏览器端用 crypto.randomUUID()
  return crypto.randomUUID();
}

export const store = {
  /** 加载本地 profile，没有则返回 null */
  load(): AssessmentProfile | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AssessmentProfile;
    } catch {
      return null;
    }
  },

  /** 保存（覆盖）整份 profile */
  save(profile: AssessmentProfile): void {
    if (typeof window === "undefined") return;
    profile.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },

  /** 取或新建一份 profile（首次访问 / start 时用） */
  getOrCreate(): AssessmentProfile {
    const existing = this.load();
    if (existing) return existing;
    const fresh = emptyProfile(newSessionId());
    this.save(fresh);
    return fresh;
  },

  /** 标记某模块完成，更新 profile 字段 */
  completeModule<K extends keyof AssessmentProfile>(moduleId: ModuleId, field: K, value: AssessmentProfile[K]): AssessmentProfile {
    const p = this.load() ?? this.getOrCreate();
    (p as any)[field] = value;
    if (!p.completed.includes(moduleId)) p.completed.push(moduleId);
    this.save(p);
    return p;
  },

  /** 清空（开发期 / reset 用） */
  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  }
};
