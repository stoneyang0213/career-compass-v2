import type { APIRoute } from "astro";
import { getReport } from "../../lib/db";

export const GET: APIRoute = async ({ url, locals }) => {
  const reportId = url.searchParams.get("reportId");
  if (!reportId) return json({ error: "missing reportId" }, 400);

  const db = locals.runtime.env.DB;
  const row = await getReport(db, reportId);
  if (!row) return json({ error: "not found" }, 404);

  return json({
    reportId: row.id,
    status: row.status,
    errorMsg: row.error_msg,
    createdAt: row.created_at
  });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
