-- ============================================================
-- 0001_initial.sql · D1 schema for career-compass-v2 v1
-- 创建: assessments / reports / email_sends / events
-- ============================================================

CREATE TABLE assessments (
  id            TEXT PRIMARY KEY,           -- UUID v4 = sessionId
  created_at    INTEGER NOT NULL,            -- unix ms
  updated_at    INTEGER NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'in_progress',  -- in_progress | generating | done | error
  ip            TEXT,                        -- 提交时 IP（rate limit 用）
  basic_info    TEXT,                        -- JSON: BasicInfo
  context       TEXT,                        -- JSON: Context
  mbti_answers  TEXT,                        -- JSON: QuizAnswers
  holland_answers TEXT,                      -- JSON: QuizAnswers
  values_answers TEXT,                       -- JSON: QuizAnswers
  dimensions    TEXT,                        -- JSON: Dimensions (3 段)
  computed_profile TEXT                      -- JSON: 计分后的 profile（喂给 prompt）
);

CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_ip_day ON assessments(ip, created_at);

CREATE TABLE reports (
  id              TEXT PRIMARY KEY,         -- UUID v4 = reportId
  assessment_id   TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  status          TEXT NOT NULL,             -- generating | done | error
  model           TEXT NOT NULL,             -- 'Pro/deepseek-ai/DeepSeek-V3.2'
  prompt_tokens   INTEGER,
  completion_tokens INTEGER,
  raw_output      TEXT,                      -- LLM 原始返回（debug 用）
  parsed_report   TEXT,                      -- JSON: 给前端渲染的结构化报告
  error_msg       TEXT,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id)
);

CREATE INDEX idx_reports_assessment ON reports(assessment_id);
CREATE INDEX idx_reports_status ON reports(status);

CREATE TABLE email_sends (
  id              TEXT PRIMARY KEY,         -- UUID v4
  report_id       TEXT NOT NULL,
  email           TEXT NOT NULL,
  sent_at         INTEGER NOT NULL,
  status          TEXT NOT NULL,             -- sent | failed
  resend_message_id TEXT,
  error_msg       TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id)
);

CREATE INDEX idx_email_sends_report ON email_sends(report_id);

CREATE TABLE events (                        -- 简单事件日志，便于排查
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        INTEGER NOT NULL,
  type      TEXT NOT NULL,                   -- session_created | step_saved | generated | emailed | error
  ref_id    TEXT,                            -- 关联 assessment_id / report_id
  payload   TEXT                             -- JSON 任意附加信息
);

CREATE INDEX idx_events_ts ON events(ts);
CREATE INDEX idx_events_type_ref ON events(type, ref_id);
