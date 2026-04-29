// ============================================================
// LLM 客户端 · 硅基流动 (DeepSeek V3.2 stable) OpenAI 兼容协议
// ============================================================

const DEFAULT_BASE_URL = "https://api.siliconflow.cn/v1";
const DEFAULT_MODEL = "Pro/deepseek-ai/DeepSeek-V3.2";

export interface LLMResult {
  text: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface LLMConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export async function callLLM(config: LLMConfig, prompt: string): Promise<LLMResult> {
  const url = `${config.baseURL ?? DEFAULT_BASE_URL}/chat/completions`;
  const body = {
    model: config.model ?? DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: config.maxTokens ?? 8000,
    temperature: config.temperature ?? 0.7
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 600_000);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      throw new Error(`LLM ${resp.status}: ${errBody.slice(0, 500)}`);
    }

    const data = (await resp.json()) as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    return {
      text: data.choices[0].message.content,
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens
    };
  } finally {
    clearTimeout(timer);
  }
}

/** 解析 LLM 返回的 JSON（容错：清理 markdown 包裹 + fancy quote 修复） */
export function parseReportJSON(text: string): unknown {
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) cleaned = cleaned.slice(first, last + 1);
  try {
    return JSON.parse(cleaned);
  } catch {
    // DeepSeek V3.2 偶发把中文 fancy single quote 当 JSON 边界
    return JSON.parse(cleaned.replace(/[‘’]/g, '"'));
  }
}
