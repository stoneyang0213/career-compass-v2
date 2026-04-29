import type { APIRoute } from "astro";
import {
  createAssessment,
  saveAssessmentStep,
  setAssessmentStatus,
  createReport,
  finishReport,
  failReport,
  logEvent,
  countAssessmentsByIpToday
} from "../../lib/db";
import { computeAllScores } from "../../lib/scoring";
import { buildPrompt, validateProfileForGeneration } from "../../lib/prompt";
import { callLLM, parseReportJSON } from "../../lib/llm";
import type { AssessmentProfile, QuizQuestion } from "../../lib/types";
import mbtiQs from "../../data/questions/mbti.json";
import hollandQs from "../../data/questions/holland.json";
import valuesQs from "../../data/questions/values.json";

const RATE_LIMIT_PER_IP_PER_DAY = 5;

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const env = locals.runtime.env;
  const ctx = locals.runtime.ctx;
  const db = env.DB;

  let profile: AssessmentProfile;
  try {
    profile = await request.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  // 1. 校验 profile 完整
  const validation = validateProfileForGeneration(profile);
  if (!validation.ok) {
    return json({ error: "profile incomplete", missing: validation.missing }, 400);
  }

  // 2. IP rate limit
  const ip = clientAddress ?? request.headers.get("cf-connecting-ip") ?? "unknown";
  const todayCount = await countAssessmentsByIpToday(db, ip);
  if (todayCount >= RATE_LIMIT_PER_IP_PER_DAY) {
    return json({ error: "rate limit", message: `每个 IP 每天最多 ${RATE_LIMIT_PER_IP_PER_DAY} 次` }, 429);
  }

  // 3. 持久化 profile 到 D1
  const sessionId = profile.sessionId ?? crypto.randomUUID();
  await createAssessment(db, sessionId, ip);
  await saveAssessmentStep(db, sessionId, "basic", profile.basic!);
  await saveAssessmentStep(db, sessionId, "context", profile.context!);
  await saveAssessmentStep(db, sessionId, "mbti", profile.mbtiAnswers!);
  await saveAssessmentStep(db, sessionId, "holland", profile.hollandAnswers!);
  await saveAssessmentStep(db, sessionId, "values", profile.valuesAnswers!);
  await saveAssessmentStep(db, sessionId, "dimensions", profile.dimensions!);

  // 4. 计分
  const computed = computeAllScores(
    profile.mbtiAnswers!,
    mbtiQs as QuizQuestion[],
    profile.hollandAnswers!,
    hollandQs as QuizQuestion[],
    profile.valuesAnswers!,
    valuesQs as QuizQuestion[]
  );

  await setAssessmentStatus(db, sessionId, "generating", computed);

  // 5. 创建 report 行
  const reportId = crypto.randomUUID();
  const model = env.SILICONFLOW_MODEL ?? "Pro/deepseek-ai/DeepSeek-V3.2";
  await createReport(db, reportId, sessionId, model);
  await logEvent(db, "generate_started", reportId, { sessionId });

  // 6. 异步调 LLM（waitUntil 让 response 立刻返回）
  const llmPromise = (async () => {
    try {
      const prompt = buildPrompt({
        basic: profile.basic!,
        context: profile.context!,
        computed,
        dimensions: profile.dimensions!
      });

      const result = await callLLM(
        {
          apiKey: env.SILICONFLOW_API_KEY,
          baseURL: env.SILICONFLOW_BASE_URL,
          model
        },
        prompt
      );

      const parsed = parseReportJSON(result.text);
      await finishReport(db, reportId, {
        rawOutput: result.text,
        parsed: parsed as object,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens
      });
      await setAssessmentStatus(db, sessionId, "done");
      await logEvent(db, "generate_done", reportId, {
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await failReport(db, reportId, msg);
      await setAssessmentStatus(db, sessionId, "error");
      await logEvent(db, "generate_failed", reportId, { error: msg });
    }
  })();

  ctx.waitUntil(llmPromise);

  return json({ reportId, sessionId });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
