import type { APIRoute } from "astro";
import { getReport, recordEmailSend, logEvent } from "../../lib/db";

export const POST: APIRoute = async ({ request, locals, url }) => {
  const env = locals.runtime.env;
  const db = env.DB;

  let body: { reportId?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  const { reportId, email } = body;
  if (!reportId || !email) return json({ error: "missing reportId or email" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "invalid email" }, 400);

  const report = await getReport(db, reportId);
  if (!report) return json({ error: "report not found" }, 404);
  if (report.status !== "done") return json({ error: "report not ready", status: report.status }, 400);

  const reportLink = `${url.origin}/report/${reportId}`;
  const html = renderEmailHTML(reportLink);

  let resendId: string | undefined;
  let errorMsg: string | undefined;
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: email,
        subject: "你的天职探索职业规划报告",
        html
      })
    });
    if (!resp.ok) {
      errorMsg = `resend ${resp.status}: ${(await resp.text()).slice(0, 300)}`;
    } else {
      const data = (await resp.json()) as { id: string };
      resendId = data.id;
    }
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e);
  }

  const emailLogId = crypto.randomUUID();
  const status = errorMsg ? "failed" : "sent";
  await recordEmailSend(db, {
    id: emailLogId,
    reportId,
    email,
    status,
    resendMessageId: resendId,
    errorMsg
  });
  await logEvent(db, status === "sent" ? "email_sent" : "email_failed", reportId, { email, errorMsg });

  if (errorMsg) return json({ error: errorMsg }, 502);
  return json({ ok: true, resendId });
};

function renderEmailHTML(link: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN"><body style="font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;max-width:560px;margin:40px auto;padding:0 20px;color:#1f2937;line-height:1.6;">
  <h1 style="font-size:24px;margin-bottom:8px;">天职探索 · 你的职业规划报告</h1>
  <p style="color:#6b7280;font-size:14px;margin-bottom:32px;">基于 MBTI、霍兰德、舒伯三大测评 + AI 深度分析</p>
  <p>报告已生成完毕。点击下面的按钮查看完整报告：</p>
  <p style="margin:32px 0;">
    <a href="${link}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:14px 32px;border-radius:9999px;font-weight:500;">查看完整报告</a>
  </p>
  <p style="color:#6b7280;font-size:14px;">如果按钮无法点击，请复制此链接到浏览器：<br><a href="${link}" style="color:#3b82f6;word-break:break-all;">${link}</a></p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:40px 0;" />
  <p style="color:#9ca3af;font-size:12px;">这份报告仅供你参考。职业规划是一段动态旅程，欢迎随时回到 <a href="https://assess.stoneyang.top" style="color:#9ca3af;">天职探索</a> 重新评估。</p>
</body></html>`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
