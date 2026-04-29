/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  DB: D1Database;
  SILICONFLOW_API_KEY: string;
  SILICONFLOW_BASE_URL?: string;
  SILICONFLOW_MODEL?: string;
  RESEND_API_KEY: string;
  RESEND_FROM: string;
  ADMIN_TOKEN: string;
}
