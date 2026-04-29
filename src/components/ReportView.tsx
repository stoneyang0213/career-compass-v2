import { useState } from "react";

interface ParsedReport {
  executiveSummary?: { overview: string; topRecommendation: string };
  personalProfile?: {
    passions?: { description: string; keyThemes?: string[]; alignmentWithMBTI?: string; alignmentWithHolland?: string };
    skills?: { description: string; coreCompetencies?: string[]; personalitySupport?: string; naturalAptitudes?: string };
    values?: { description: string; coreValues?: string[]; workEnvironment?: string; lifestyleGoals?: string };
  };
  careerPaths?: Array<{
    title: string;
    description: string;
    matchScore?: number;
    frameworkAlignment?: { passion: string; strength: string; demand: string; benefit: string };
    responsibilities?: string[];
    qualifications?: string[];
    demand?: string;
    earningPotential?: string;
  }>;
  deepDive?: {
    recommendedPath: string;
    careerTrajectory: string;
    challenges?: string[];
    opportunities?: string[];
    explorationSteps?: string[];
    requiredSkills?: string[];
    certifications?: string[];
  };
  actionPlan?: {
    shortTerm?: { timeline: string; steps?: string[]; skills?: string[]; networking?: string[]; resources?: string[] };
    midTerm?: { timeline: string; milestones?: string[]; resumeEnhancement?: string[]; jobSearchPrep?: string[] };
    longTerm?: { timeline: string; careerGoals?: string[]; professionalDevelopment?: string[]; targets?: string[] };
  };
  concludingRemarks?: string;
}

export default function ReportView({ report, reportId }: { report: ParsedReport; reportId: string }) {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [emailMsg, setEmailMsg] = useState("");

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus("failed");
      setEmailMsg("邮箱格式不对");
      return;
    }
    setEmailStatus("sending");
    setEmailMsg("");
    try {
      const resp = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, email })
      });
      const data = await resp.json();
      if (resp.ok) {
        setEmailStatus("sent");
        setEmailMsg("已发送，请查看邮箱（可能在垃圾箱）");
      } else {
        setEmailStatus("failed");
        setEmailMsg(`发送失败：${data.error ?? resp.status}`);
      }
    } catch (e) {
      setEmailStatus("failed");
      setEmailMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <article className="space-y-16">
      {/* Header */}
      <header className="text-center pt-8 pb-4 border-b border-gray-100">
        <p className="text-xs tracking-widest text-gray-500 uppercase mb-3">Career Planning Report</p>
        <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">职业规划报告</h1>
        {report.executiveSummary?.topRecommendation && (
          <p className="mt-4 text-lg text-gray-600">
            首要推荐：<span className="font-medium text-gray-900">{report.executiveSummary.topRecommendation}</span>
          </p>
        )}
      </header>

      {/* Section: 执行摘要 */}
      {report.executiveSummary && (
        <Section title="执行摘要" icon="📋">
          <p className="text-base text-gray-700 leading-loose">{report.executiveSummary.overview}</p>
        </Section>
      )}

      {/* Section: 个人画像 */}
      {report.personalProfile && (
        <Section title="个人画像分析" icon="👤">
          <SubSection label="💖 择己所爱（兴趣与热情）" data={report.personalProfile.passions} />
          <SubSection label="💪 择己所长（技能与优势）" data={report.personalProfile.skills} />
          <SubSection label="💎 价值观与生活方式" data={report.personalProfile.values} />
        </Section>
      )}

      {/* Section: 推荐职业 */}
      {report.careerPaths && report.careerPaths.length > 0 && (
        <Section title="推荐职业路径" icon="🎯">
          <div className="space-y-10">
            {report.careerPaths.map((path, i) => (
              <CareerPathCard key={i} path={path} index={i + 1} />
            ))}
          </div>
        </Section>
      )}

      {/* Section: 深度剖析 */}
      {report.deepDive && (
        <Section title={`首选路径深度剖析：${report.deepDive.recommendedPath}`} icon="🔍">
          <p className="text-base text-gray-700 leading-loose mb-6">{report.deepDive.careerTrajectory}</p>
          <ListGroup label="挑战与对策" items={report.deepDive.challenges} />
          <ListGroup label="机会" items={report.deepDive.opportunities} />
          <ListGroup label="试水步骤" items={report.deepDive.explorationSteps} />
          <ListGroup label="必备技能" items={report.deepDive.requiredSkills} />
          <ListGroup label="推荐认证 / 课程" items={report.deepDive.certifications} />
        </Section>
      )}

      {/* Section: 行动计划 */}
      {report.actionPlan && (
        <Section title="行动计划" icon="📅">
          {(["shortTerm", "midTerm", "longTerm"] as const).map((phase) => {
            const p = report.actionPlan?.[phase];
            if (!p) return null;
            const phaseLabel = { shortTerm: "短期", midTerm: "中期", longTerm: "长期" }[phase];
            return (
              <div key={phase} className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {phaseLabel}
                  {p.timeline && <span className="text-sm text-gray-500 ml-2">{p.timeline}</span>}
                </h3>
                <ListGroup label="" items={(p as any).steps ?? (p as any).milestones ?? (p as any).careerGoals} />
                <ListGroup label="技能" items={(p as any).skills} />
                <ListGroup label="人脉" items={(p as any).networking} />
                <ListGroup label="资源" items={(p as any).resources} />
                <ListGroup label="简历强化" items={(p as any).resumeEnhancement} />
                <ListGroup label="求职准备" items={(p as any).jobSearchPrep} />
                <ListGroup label="职业目标" items={(p as any).careerGoals} />
                <ListGroup label="专业发展" items={(p as any).professionalDevelopment} />
                <ListGroup label="收入 / 生活方式目标" items={(p as any).targets} />
              </div>
            );
          })}
        </Section>
      )}

      {/* Section: 导师寄语 */}
      {report.concludingRemarks && (
        <Section title="导师寄语" icon="💬">
          <blockquote className="text-base text-gray-700 leading-loose italic border-l-4 border-gray-900 pl-6">
            {report.concludingRemarks}
          </blockquote>
        </Section>
      )}

      {/* Email capture */}
      <section className="pt-12 mt-12 border-t border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">把这份报告发到邮箱</h2>
        <p className="text-sm text-gray-500 mb-6">报告链接会发到你邮箱，方便以后查看</p>
        <form onSubmit={sendEmail} className="flex gap-3 max-w-md">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={emailStatus === "sending" || emailStatus === "sent"}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-gray-900 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={emailStatus === "sending" || emailStatus === "sent"}
            className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
          >
            {emailStatus === "sending" ? "发送中…" : emailStatus === "sent" ? "✓ 已发送" : "发送"}
          </button>
        </form>
        {emailMsg && (
          <p className={`text-sm mt-3 ${emailStatus === "failed" ? "text-red-600" : "text-gray-600"}`}>{emailMsg}</p>
        )}
      </section>

      <footer className="text-center pt-12 text-xs text-gray-400 space-y-2">
        <p>报告 ID: {reportId}</p>
        <p>· 仅供参考。职业规划是一段动态旅程 ·</p>
      </footer>
    </article>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubSection({ label, data }: { label: string; data?: { description: string; keyThemes?: string[]; alignmentWithMBTI?: string; alignmentWithHolland?: string; coreCompetencies?: string[]; personalitySupport?: string; naturalAptitudes?: string; coreValues?: string[]; workEnvironment?: string; lifestyleGoals?: string } }) {
  if (!data) return null;
  const tags = (data as any).keyThemes ?? (data as any).coreCompetencies ?? (data as any).coreValues;
  return (
    <div className="mb-8 pb-6 border-b border-gray-100 last:border-0">
      <h3 className="text-lg font-medium text-gray-900 mb-3">{label}</h3>
      <p className="text-base text-gray-700 leading-loose mb-4">{data.description}</p>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((t: string, i: number) => (
            <span key={i} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">{t}</span>
          ))}
        </div>
      )}
      {(data as any).alignmentWithMBTI && <p className="text-sm text-gray-600 italic mt-2">MBTI 契合：{(data as any).alignmentWithMBTI}</p>}
      {(data as any).alignmentWithHolland && <p className="text-sm text-gray-600 italic mt-2">霍兰德契合：{(data as any).alignmentWithHolland}</p>}
      {(data as any).personalitySupport && <p className="text-sm text-gray-600 italic mt-2">{(data as any).personalitySupport}</p>}
      {(data as any).naturalAptitudes && <p className="text-sm text-gray-600 italic mt-2">{(data as any).naturalAptitudes}</p>}
      {(data as any).workEnvironment && <p className="text-sm text-gray-600 mt-2"><span className="font-medium">工作环境：</span>{(data as any).workEnvironment}</p>}
      {(data as any).lifestyleGoals && <p className="text-sm text-gray-600 mt-2"><span className="font-medium">生活方式目标：</span>{(data as any).lifestyleGoals}</p>}
    </div>
  );
}

function CareerPathCard({ path, index }: { path: ParsedReport["careerPaths"][number]; index: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-8 bg-gray-50/50">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-900">{index}. {path.title}</h3>
        {path.matchScore != null && (
          <span className="px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-medium">{path.matchScore} 分</span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4">{path.description}</p>
      {path.frameworkAlignment && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
          <div><span className="font-medium text-gray-900">💖 爱：</span><span className="text-gray-700">{path.frameworkAlignment.passion}</span></div>
          <div><span className="font-medium text-gray-900">💪 长：</span><span className="text-gray-700">{path.frameworkAlignment.strength}</span></div>
          <div><span className="font-medium text-gray-900">🌍 需：</span><span className="text-gray-700">{path.frameworkAlignment.demand}</span></div>
          <div><span className="font-medium text-gray-900">💰 利：</span><span className="text-gray-700">{path.frameworkAlignment.benefit}</span></div>
        </div>
      )}
      <ListGroup label="典型职责" items={path.responsibilities} small />
      <ListGroup label="能力门槛" items={path.qualifications} small />
      {path.demand && <p className="text-sm text-gray-600 mt-3"><span className="font-medium">行业前景：</span>{path.demand}</p>}
      {path.earningPotential && <p className="text-sm text-gray-600 mt-1"><span className="font-medium">薪资范围：</span>{path.earningPotential}</p>}
    </div>
  );
}

function ListGroup({ label, items, small }: { label: string; items?: string[]; small?: boolean }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={small ? "mt-3" : "mt-4"}>
      {label && <h4 className={`font-medium text-gray-900 mb-2 ${small ? "text-sm" : "text-base"}`}>{label}</h4>}
      <ul className={`space-y-1 ${small ? "text-sm" : "text-base"} text-gray-700`}>
        {items.map((it, i) => <li key={i}>· {it}</li>)}
      </ul>
    </div>
  );
}
