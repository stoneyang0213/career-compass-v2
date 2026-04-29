import type { APIRoute } from "astro";
import { getReport } from "../../../lib/db";

export const GET: APIRoute = async ({ params, locals }) => {
  const reportId = params.reportId;
  if (!reportId) return json({ error: "missing reportId" }, 400);

  const db = locals.runtime.env.DB;
  const row = await getReport(db, reportId);
  if (!row) return json({ error: "not found" }, 404);

  if (row.status !== "done") {
    return json({ status: row.status, errorMsg: row.error_msg }, 202);
  }

  return json({
    reportId: row.id,
    status: row.status,
    model: row.model,
    createdAt: row.created_at,
    report: row.parsed_report ? JSON.parse(row.parsed_report) : null,
    tokens: { prompt: row.prompt_tokens, completion: row.completion_tokens }
  });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
