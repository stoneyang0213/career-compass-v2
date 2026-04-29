// ============================================================
// D1 helper · 所有数据库操作集中在这
// ============================================================

import type {
  AssessmentProfile,
  BasicInfo,
  Context,
  Dimensions,
  ModuleId,
  QuizAnswers
} from "./types";

// CF Pages Functions runtime: env.DB 是 D1Database 实例
type D1 = D1Database;

// ─── assessments ────────────────────────────────────────────

export async function createAssessment(db: D1, sessionId: string, ip?: string): Promise<void> {
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO assessments (id, created_at, updated_at, status, ip)
       VALUES (?, ?, ?, 'in_progress', ?)`
    )
    .bind(sessionId, now, now, ip ?? null)
    .run();
}

export async function getAssessment(db: D1, sessionId: string): Promise<AssessmentRow | null> {
  const row = await db
    .prepare(`SELECT * FROM assessments WHERE id = ?`)
    .bind(sessionId)
    .first<AssessmentRow>();
  return row ?? null;
}

export async function saveAssessmentStep(
  db: D1,
  sessionId: string,
  moduleId: ModuleId,
  data: BasicInfo | Context | QuizAnswers | Dimensions
): Promise<void> {
  const colMap: Record<ModuleId, string> = {
    basic: "basic_info",
    context: "context",
    mbti: "mbti_answers",
    holland: "holland_answers",
    values: "values_answers",
    dimensions: "dimensions"
  };
  const col = colMap[moduleId];
  await db
    .prepare(`UPDATE assessments SET ${col} = ?, updated_at = ? WHERE id = ?`)
    .bind(JSON.stringify(data), Date.now(), sessionId)
    .run();
}

export async function setAssessmentStatus(
  db: D1,
  sessionId: string,
  status: AssessmentStatus,
  computedProfile?: object
): Promise<void> {
  if (computedProfile != null) {
    await db
      .prepare(
        `UPDATE assessments SET status = ?, computed_profile = ?, updated_at = ? WHERE id = ?`
      )
      .bind(status, JSON.stringify(computedProfile), Date.now(), sessionId)
      .run();
  } else {
    await db
      .prepare(`UPDATE assessments SET status = ?, updated_at = ? WHERE id = ?`)
      .bind(status, Date.now(), sessionId)
      .run();
  }
}

// ─── reports ─────────────────────────────────────────────────

export async function createReport(
  db: D1,
  reportId: string,
  assessmentId: string,
  model: string
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO reports (id, assessment_id, created_at, status, model)
       VALUES (?, ?, ?, 'generating', ?)`
    )
    .bind(reportId, assessmentId, Date.now(), model)
    .run();
}

export async function finishReport(
  db: D1,
  reportId: string,
  payload: {
    rawOutput: string;
    parsed: object;
    promptTokens?: number;
    completionTokens?: number;
  }
): Promise<void> {
  await db
    .prepare(
      `UPDATE reports
         SET status = 'done',
             raw_output = ?,
             parsed_report = ?,
             prompt_tokens = ?,
             completion_tokens = ?
       WHERE id = ?`
    )
    .bind(
      payload.rawOutput,
      JSON.stringify(payload.parsed),
      payload.promptTokens ?? null,
      payload.completionTokens ?? null,
      reportId
    )
    .run();
}

export async function failReport(db: D1, reportId: string, errorMsg: string): Promise<void> {
  await db
    .prepare(`UPDATE reports SET status = 'error', error_msg = ? WHERE id = ?`)
    .bind(errorMsg, reportId)
    .run();
}

export async function getReport(db: D1, reportId: string): Promise<ReportRow | null> {
  const row = await db
    .prepare(`SELECT * FROM reports WHERE id = ?`)
    .bind(reportId)
    .first<ReportRow>();
  return row ?? null;
}

// ─── email_sends ─────────────────────────────────────────────

export async function recordEmailSend(
  db: D1,
  payload: {
    id: string;
    reportId: string;
    email: string;
    status: "sent" | "failed";
    resendMessageId?: string;
    errorMsg?: string;
  }
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO email_sends (id, report_id, email, sent_at, status, resend_message_id, error_msg)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      payload.id,
      payload.reportId,
      payload.email,
      Date.now(),
      payload.status,
      payload.resendMessageId ?? null,
      payload.errorMsg ?? null
    )
    .run();
}

// ─── events ─────────────────────────────────────────────────

export async function logEvent(
  db: D1,
  type: string,
  refId?: string,
  payload?: object
): Promise<void> {
  await db
    .prepare(`INSERT INTO events (ts, type, ref_id, payload) VALUES (?, ?, ?, ?)`)
    .bind(Date.now(), type, refId ?? null, payload ? JSON.stringify(payload) : null)
    .run();
}

// ─── rate limit helpers ──────────────────────────────────────

/** 一天内同 IP 的 assessment 数（用于限流） */
export async function countAssessmentsByIpToday(db: D1, ip: string): Promise<number> {
  const dayStart = Date.now() - 24 * 60 * 60 * 1000;
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM assessments WHERE ip = ? AND created_at >= ?`)
    .bind(ip, dayStart)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

// ─── 类型 ─────────────────────────────────────────────────────

export type AssessmentStatus = "in_progress" | "generating" | "done" | "error";

export interface AssessmentRow {
  id: string;
  created_at: number;
  updated_at: number;
  status: AssessmentStatus;
  ip: string | null;
  basic_info: string | null;
  context: string | null;
  mbti_answers: string | null;
  holland_answers: string | null;
  values_answers: string | null;
  dimensions: string | null;
  computed_profile: string | null;
}

export interface ReportRow {
  id: string;
  assessment_id: string;
  created_at: number;
  status: "generating" | "done" | "error";
  model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  raw_output: string | null;
  parsed_report: string | null;
  error_msg: string | null;
}

/** 把 D1 行还原成 AssessmentProfile（前端可用形态） */
export function rowToProfile(row: AssessmentRow): AssessmentProfile {
  return {
    sessionId: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    basic: row.basic_info ? JSON.parse(row.basic_info) : undefined,
    context: row.context ? JSON.parse(row.context) : undefined,
    mbtiAnswers: row.mbti_answers ? JSON.parse(row.mbti_answers) : undefined,
    hollandAnswers: row.holland_answers ? JSON.parse(row.holland_answers) : undefined,
    valuesAnswers: row.values_answers ? JSON.parse(row.values_answers) : undefined,
    dimensions: row.dimensions ? JSON.parse(row.dimensions) : undefined,
    completed: deriveCompleted(row)
  };
}

function deriveCompleted(row: AssessmentRow): ModuleId[] {
  const out: ModuleId[] = [];
  if (row.basic_info) out.push("basic");
  if (row.context) out.push("context");
  if (row.mbti_answers) out.push("mbti");
  if (row.holland_answers) out.push("holland");
  if (row.values_answers) out.push("values");
  if (row.dimensions) out.push("dimensions");
  return out;
}
