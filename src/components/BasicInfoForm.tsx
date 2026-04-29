import { useEffect, useState } from "react";
import { store } from "../lib/store";
import { nextModule } from "../lib/modules";
import type { BasicInfo } from "../lib/types";

const GENDER_OPTIONS: BasicInfo["gender"][] = ["男", "女", "其他"];

export default function BasicInfoForm() {
  const [data, setData] = useState<Partial<BasicInfo>>({});
  const [error, setError] = useState<string | null>(null);

  // hydrate from store
  useEffect(() => {
    const p = store.load();
    if (p?.basic) setData(p.basic);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!data.name?.trim()) {
      setError("请填写姓名");
      return;
    }
    const age = Number(data.age);
    if (!age || age < 12 || age > 80) {
      setError("请填写一个 12-80 之间的年龄");
      return;
    }

    const profile = store.completeModule("basic", "basic", {
      name: data.name.trim(),
      age,
      gender: data.gender
    });

    const next = nextModule("basic");
    window.location.assign(next?.route ?? "/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Field label="你希望我们怎么称呼你？" required>
        <input
          type="text"
          autoFocus
          value={data.name ?? ""}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          placeholder="姓名 / 昵称"
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-gray-900 text-lg"
        />
      </Field>

      <Field label="你今年多大？" required hint="数字即可，例如 28">
        <input
          type="number"
          inputMode="numeric"
          value={data.age ?? ""}
          onChange={(e) => setData({ ...data, age: Number(e.target.value) || undefined })}
          placeholder="年龄"
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-gray-900 text-lg"
        />
      </Field>

      <Field label="性别（可选）">
        <div className="flex gap-3">
          {GENDER_OPTIONS.map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => setData({ ...data, gender: g })}
              className={`px-5 py-2 rounded-full border text-sm transition ${
                data.gender === g
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="pt-6">
        <button
          type="submit"
          className="w-full md:w-auto px-10 py-4 bg-gray-900 text-white text-base font-medium rounded-full hover:bg-gray-800 transition"
        >
          下一步 →
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  children
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-base font-medium text-gray-900 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}
