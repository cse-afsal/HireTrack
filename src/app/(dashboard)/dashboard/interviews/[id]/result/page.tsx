"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ThumbsUp, AlertTriangle, Lightbulb, ChevronLeft,
  BarChart2, Loader2, RefreshCcw, CheckCircle2, XCircle, AlertCircle, Minus, SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/* ── Types ── */
interface QuestionRow {
  id: string; prompt: string;
  userAnswer: string | null; score: number | null; feedback: string | null;
  isSkipped?: boolean;
}
interface ParsedFeedback {
  feedback: string; isCorrect: "correct" | "partial" | "incorrect"; modelAnswer: string;
}
interface ReviewData {
  overallScore: number; summary: string; verdict: string;
  strengths: string[]; improvements: string[]; topics: string[];
}

/* ── Parse feedback field (may be JSON or plain string) ── */
function parseFeedback(raw: string | null): ParsedFeedback {
  if (!raw) return { feedback: "—", isCorrect: "partial", modelAnswer: "" };
  try {
    const p = JSON.parse(raw);
    return {
      feedback:    p.feedback    ?? raw,
      isCorrect:   p.isCorrect   ?? "partial",
      modelAnswer: p.modelAnswer ?? "",
    };
  } catch { return { feedback: raw, isCorrect: "partial", modelAnswer: "" }; }
}

/* ── Colour helpers ── */
function scoreColor(s: number) {
  if (s >= 80) return { ring: "#10b981", label: "text-emerald-400" };
  if (s >= 60) return { ring: "#f59e0b", label: "text-yellow-400" };
  return        { ring: "#ef4444",  label: "text-red-400" };
}
function qBadgeStyle(s: number) {
  if (s >= 8) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (s >= 5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return             "bg-red-500/20 text-red-400 border-red-500/30";
}

/* ── Correctness badge ── */
function CorrectnessBadge({ v, skipped }: { v: "correct" | "partial" | "incorrect"; skipped?: boolean }) {
  if (skipped) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-700/60 text-neutral-400 border border-neutral-600/40"><SkipForward className="w-3 h-3"/>Skipped</span>;
  if (v === "correct")   return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"><CheckCircle2 className="w-3 h-3"/>Correct</span>;
  if (v === "partial")   return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25"><AlertCircle className="w-3 h-3"/>Partial</span>;
  return                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/25"><XCircle className="w-3 h-3"/>Incorrect · 0 pts</span>;
}

/* ── SVG Score Ring ── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 54, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} stroke="#262626" strokeWidth="10" fill="none"/>
      <circle cx="70" cy="70" r={r} stroke={color} strokeWidth="10" fill="none"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 70 70)" style={{ transition:"stroke-dasharray 1.2s ease" }}/>
      <text x="70" y="70" textAnchor="middle" dy="8" fill="white" fontSize="28" fontWeight="800">{score}</text>
      <text x="70" y="91" textAnchor="middle" fill="#737373" fontSize="11">/100</text>
    </svg>
  );
}

/* ── Bar + correctness chart ── */
function QScoreChart({ questions }: { questions: QuestionRow[] }) {
  const maxH = 70;
  return (
    <div className="flex items-end gap-1.5 h-[90px] pt-2">
      {questions.map((q, i) => {
        const s  = q.score ?? 0;
        const h  = Math.max(4, Math.round((s / 10) * maxH));
        const pf = parseFeedback(q.feedback);
        const c  = q.isSkipped ? "#525252" :
                   pf.isCorrect === "correct" ? "#10b981" :
                   pf.isCorrect === "partial"  ? "#f59e0b" : "#ef4444";
        return (
          <div key={q.id} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[9px] text-neutral-400 font-bold">{q.isSkipped ? "-" : s}</span>
            <div className="w-full rounded-t-md" style={{ height:`${h}px`, background:c }}/>
            <span className="text-[9px] text-neutral-600">Q{i+1}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Summary stats ── */
function Stats({ questions }: { questions: QuestionRow[] }) {
  const skipped = questions.filter(q => q.isSkipped).length;
  const parsed  = questions.filter(q => !q.isSkipped).map(q => parseFeedback(q.feedback));
  const correct = parsed.filter(p => p.isCorrect === "correct").length;
  const partial = parsed.filter(p => p.isCorrect === "partial").length;
  const wrong   = parsed.filter(p => p.isCorrect === "incorrect").length;
  return (
    <div className="grid grid-cols-2 gap-3 text-center">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-4">
        <div className="text-3xl font-black text-emerald-400">{correct}</div>
        <div className="text-xs text-emerald-500 mt-1 font-medium">Correct ✔️</div>
      </div>
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl py-4">
        <div className="text-3xl font-black text-yellow-400">{partial}</div>
        <div className="text-xs text-yellow-500 mt-1 font-medium">Partial ⚠️</div>
      </div>
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl py-4">
        <div className="text-3xl font-black text-red-400">{wrong}</div>
        <div className="text-xs text-red-500 mt-1 font-medium">Incorrect ✕</div>
      </div>
      <div className="bg-neutral-700/30 border border-neutral-700/40 rounded-xl py-4">
        <div className="text-3xl font-black text-neutral-400">{skipped}</div>
        <div className="text-xs text-neutral-500 mt-1 font-medium">Skipped ⏭️</div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function InterviewResultPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string|null>(null);
  const [score,     setScore]     = useState(0);
  const [review,    setReview]    = useState<ReviewData|null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [expanded,  setExpanded]  = useState<string|null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`/api/interviews/${id}/review`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load review");
      setScore(data.score ?? 0);
      setQuestions(data.questions ?? []);
      try {
        const rv: ReviewData = typeof data.feedback === "string" ? JSON.parse(data.feedback) : data.feedback;
        setReview(rv);
      } catch { setReview(null); }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-400"/>
      <p className="text-neutral-400">Generating your AI performance review…</p>
    </div>
  );
  if (error) return (
    <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
      <XCircle className="w-10 h-10 text-red-400"/>
      <p className="text-neutral-300">{error}</p>
      <Button onClick={load} variant="outline" className="border-neutral-700 text-neutral-300">
        <RefreshCcw className="w-4 h-4 mr-2"/> Retry
      </Button>
    </div>
  );

  const { ring, label } = scoreColor(score);

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 px-4">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/interviews">
          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
            <ChevronLeft className="w-5 h-5"/>
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Interview Review</h1>
          <p className="text-neutral-400 mt-0.5 text-sm">
            {review?.verdict && <span className={`font-semibold mr-2 ${label}`}>{review.verdict}</span>}
            {questions.length} questions · AI-powered analysis
          </p>
        </div>
        <div className="ml-auto">
          <Button onClick={() => router.push("/dashboard/interviews/new")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white">
            New Interview
          </Button>
        </div>
      </div>

      {/* KPI row: score ring + chart + stats */}
      <div className="grid md:grid-cols-3 gap-5">
        <Card className="bg-neutral-900 border-neutral-800 p-6 flex flex-col items-center justify-center gap-3">
          <ScoreRing score={score} color={ring}/>
          <p className={`font-bold text-lg ${label}`}>{review?.verdict ?? "Complete"}</p>
          <p className="text-xs text-neutral-500 text-center">Overall interview score</p>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-indigo-400"/>
            <span className="font-semibold text-white text-sm">Score per Question</span>
          </div>
          {questions.length > 0
            ? <QScoreChart questions={questions}/>
            : <p className="text-neutral-500 text-sm">No data yet.</p>}
          <div className="flex gap-3 mt-3 text-[10px] text-neutral-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block"/>Correct</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block"/>Partial</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block"/>Incorrect</span>
          </div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-5">
          <p className="font-semibold text-white text-sm mb-3">Answer Accuracy</p>
          <Stats questions={questions}/>
        </Card>
      </div>

      {/* AI Summary */}
      {review?.summary && (
        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <h3 className="text-lg font-bold text-white mb-3">Overall Assessment</h3>
          <p className="text-neutral-300 leading-relaxed">{review.summary}</p>
        </Card>
      )}

      {/* Strengths + Improvements */}
      <div className="grid md:grid-cols-2 gap-5">
        {(review?.strengths?.length ?? 0) > 0 && (
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><ThumbsUp className="w-4 h-4 text-emerald-400"/></div>
              <h3 className="font-bold text-white">What You Did Well</h3>
            </div>
            <ul className="space-y-2">
              {review!.strengths.map((s,i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>{s}
                </li>
              ))}
            </ul>
          </Card>
        )}
        {(review?.improvements?.length ?? 0) > 0 && (
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg"><AlertTriangle className="w-4 h-4 text-yellow-400"/></div>
              <h3 className="font-bold text-white">Areas for Improvement</h3>
            </div>
            <ul className="space-y-2">
              {review!.improvements.map((s,i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                  <Minus className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5"/>{s}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Topics chips */}
      {(review?.topics?.length ?? 0) > 0 && (
        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg"><Lightbulb className="w-4 h-4 text-indigo-400"/></div>
            <h3 className="font-bold text-white">Recommended Topics to Study</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {review!.topics.map((t,i) => (
              <span key={i} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-300">{t}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Q&A Breakdown */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-white border-b border-neutral-800 pb-3">
            Detailed Q&A Breakdown
          </h3>
          {questions.map((q, i) => {
            const qs  = q.score ?? 0;
            const pf  = parseFeedback(q.feedback);
            const open= expanded === q.id;
            return (
              <Card key={q.id}
                className={`bg-neutral-900 border cursor-pointer transition-all ${open?"border-indigo-500/40":"border-neutral-800 hover:border-neutral-700"}`}
                onClick={() => setExpanded(open ? null : q.id)}>
                <div className="p-5 flex items-start gap-4">
                  {/* Score badge */}
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-lg font-black shrink-0 ${
                    q.isSkipped ? "bg-neutral-700/40 border-neutral-600/40 text-neutral-500" : qBadgeStyle(qs)
                  }`}>
                    {q.isSkipped ? <SkipForward className="w-5 h-5" /> : qs}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-neutral-500 font-medium">Q{i+1}</span>
                      <CorrectnessBadge v={pf.isCorrect} skipped={q.isSkipped} />
                    </div>
                    <p className="text-white font-medium leading-snug line-clamp-2">{q.prompt}</p>

                    {open && (
                      <div className="mt-4 space-y-3 border-t border-neutral-800 pt-4">
                        {/* Your answer / skipped notice */}
                        <div>
                          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 font-semibold">Your Answer</p>
                          <p className="text-sm text-neutral-300 leading-relaxed bg-neutral-800/50 rounded-lg p-3">
                            {q.isSkipped
                              ? <span className="italic text-neutral-500 flex items-center gap-1.5"><SkipForward className="w-3.5 h-3.5" /> This question was skipped — no marks awarded.</span>
                              : q.userAnswer || <span className="italic text-neutral-600">No answer recorded</span>}
                          </p>
                        </div>

                        {/* AI feedback (only when not skipped) */}
                        {!q.isSkipped && (
                          <div className={`rounded-xl p-3 border ${
                            pf.isCorrect==="correct"  ? "bg-emerald-500/5 border-emerald-500/20" :
                            pf.isCorrect==="partial"  ? "bg-yellow-500/5 border-yellow-500/20" :
                                                        "bg-red-500/5 border-red-500/20"
                          }`}>
                            <p className={`text-[10px] uppercase tracking-wider mb-1 font-bold ${
                              pf.isCorrect==="correct"?"text-emerald-400":pf.isCorrect==="partial"?"text-yellow-400":"text-red-400"
                            }`}>
                              AI Evaluation · {pf.isCorrect.charAt(0).toUpperCase()+pf.isCorrect.slice(1)}
                              {pf.isCorrect === "incorrect" && " · 0 pts"}
                            </p>
                            <p className="text-sm text-neutral-300 leading-relaxed">{pf.feedback}</p>
                          </div>
                        )}

                        {/* Model answer — always shown when expanded */}
                        {pf.modelAnswer && (
                          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3">
                            <p className="text-[10px] text-indigo-400 uppercase tracking-wider mb-1 font-bold">✨ What a Strong Answer Should Include</p>
                            <p className="text-sm text-neutral-300 leading-relaxed">{pf.modelAnswer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="text-neutral-600 text-xs shrink-0 mt-1">{open?"▲":"▼"}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-center gap-4 pt-4 pb-8">
        <Link href="/dashboard/interviews/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">Practice Again</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:text-white px-8">Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
