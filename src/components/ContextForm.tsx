import { useEffect, useState } from "react";
import { store } from "../lib/store";
import { nextModule } from "../lib/modules";
import type { Context, EducationLevel, CareerStage, TargetLocation } from "../lib/types";

const EDUCATION_LEVELS: EducationLevel[] = [
  "高中在读", "高中毕业", "大学在读", "大学毕业",
  "硕士在读", "硕士毕业", "博士在读", "博士毕业"
];

const CAREER_STAGES: CareerStage[] = [
  "在校探索", "应届求职", "在职稳定", "考虑转型",
  "主动创业", "自由职业", "待业", "退休返聘"
];

const TARGET_LOCATIONS: TargetLocation[] = [
  "一线（北上广深）", "新一线（杭州/成都/武汉等）",
  "二线", "三四线", "海外", "远程", "不限"
];

export default function ContextForm() {
  const [data, setData] = useState<Context>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = store.load();
    if (p?.context) setData(p.context);
  }, []);

  function set<K extends keyof Context>(key: K, value: Context[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!data.careerStage) {
      setError("请选择当前的职业阶段（必填）");
      return;
    }

    store.completeModule("context", "context", data);
    const next = nextModule("context");
    window.location.assign(next?.route ?? "/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <p class="text-sm text-gray-500 -mt-6">
        这一节信息直接影响 AI 的推荐方向。教育、工作、地域、约束，越具体越好。
      </p>

      <Section title="教育">
        <Row>
          <Field label="当前阶段">
            <Select
              value={data.educationLevel ?? ""}
              onChange={(v) => set("educationLevel", (v || undefined) as EducationLevel)}
              options={EDUCATION_LEVELS}
              placeholder="选择"
            />
          </Field>
          <Field label="毕业年份" hint="预计或实际，如 2027">
            <Input
              type="number"
              value={data.graduationYear ?? ""}
              onChange={(v) => set("graduationYear", v ? Number(v) : undefined)}
              placeholder="2027"
            />
          </Field>
        </Row>
        <Field label="学校" hint="含层级，如：浙江大学（985）/ 美国 Wheaton College（文理学院）">
          <Input
            value={data.school ?? ""}
            onChange={(v) => set("school", v || undefined)}
            placeholder="学校名 + 层级"
          />
        </Field>
        <Field label="专业" hint="含双学位/辅修，如：艺术 + 计算机科学双学位">
          <Input
            value={data.major ?? ""}
            onChange={(v) => set("major", v || undefined)}
            placeholder="专业方向"
          />
        </Field>
      </Section>

      <Section title="工作">
        <Row>
          <Field label="工作年限" hint="应届填 0">
            <Input
              type="number"
              value={data.workYears ?? ""}
              onChange={(v) => set("workYears", v ? Number(v) : undefined)}
              placeholder="0"
            />
          </Field>
          <Field label="当前行业">
            <Input
              value={data.currentIndustry ?? ""}
              onChange={(v) => set("currentIndustry", v || undefined)}
              placeholder="互联网 / 教育 / 学生..."
            />
          </Field>
        </Row>
        <Field label="当前角色">
          <Input
            value={data.currentRole ?? ""}
            onChange={(v) => set("currentRole", v || undefined)}
            placeholder="产品经理 / 大三学生 / 自由插画师..."
          />
        </Field>
      </Section>

      <Section title="意向与定位" required>
        <Field label="当前职业阶段" required>
          <Pills
            value={data.careerStage}
            onChange={(v) => set("careerStage", v as CareerStage)}
            options={CAREER_STAGES}
          />
        </Field>
        <Field label="目标工作地">
          <Pills
            value={data.targetLocation}
            onChange={(v) => set("targetLocation", v as TargetLocation)}
            options={TARGET_LOCATIONS}
          />
        </Field>
      </Section>

      <Section title="期待与约束（可选）">
        <Row>
          <Field label="可接受最低年薪（万元）">
            <Input
              type="number"
              value={data.incomeFloor ?? ""}
              onChange={(v) => set("incomeFloor", v ? Number(v) : undefined)}
              placeholder="如 15"
            />
          </Field>
          <Field label="理想年薪（万元）">
            <Input
              type="number"
              value={data.incomeTarget ?? ""}
              onChange={(v) => set("incomeTarget", v ? Number(v) : undefined)}
              placeholder="如 50"
            />
          </Field>
        </Row>
        <Field label="其他约束" hint="家庭 / 健康 / 时间 / 户口 / 签证身份等">
          <textarea
            value={data.constraints ?? ""}
            onChange={(e) => set("constraints", e.target.value || undefined)}
            placeholder="如：H1B 抽签限制；家有老人需照顾..."
            className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-gray-900 text-base resize-none"
            rows={2}
          />
        </Field>
      </Section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="pt-6 flex items-center justify-between border-t border-gray-100">
        <a href="/assess/basic" className="text-sm text-gray-500 hover:text-gray-900">← 返回上一步</a>
        <button
          type="submit"
          className="px-10 py-4 bg-gray-900 text-white text-base font-medium rounded-full hover:bg-gray-800 transition"
        >
          下一步 →
        </button>
      </div>
    </form>
  );
}

function Section({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xs tracking-widest text-gray-500 uppercase">
        {title}{required && <span className="text-red-500 ml-1">*</span>}
      </h2>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>;
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Input({ type = "text", value, onChange, placeholder }: { type?: string; value: string | number; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-gray-900 text-base"
    />
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-gray-900 text-base"
    >
      <option value="">{placeholder ?? "选择"}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Pills({ value, onChange, options }: { value?: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          onClick={() => onChange(o)}
          className={`px-4 py-2 rounded-full border text-sm transition ${
            value === o
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
