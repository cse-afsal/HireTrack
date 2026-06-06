"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Brain, Code, FileText, Settings, Video, Mic, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function NewInterviewForm() {
  const router = useRouter();
  const [domain, setDomain] = useState("dsa");
  const [difficulty, setDifficulty] = useState("medium");
  const [type, setType] = useState("chat");
  const [resumes, setResumes] = useState([] as any[]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/resumes").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setResumes(data);
    }).catch(console.error);
  }, []);

  const handleStart = async () => {
    if (isSubmitting) return;
    if (domain === "resume" && !selectedResumeId) {
      setError("Please select a resume first.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          difficulty,
          type,
          resumeId: domain === "resume" ? selectedResumeId : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data || "Failed to create interview");
      }

      router.push(`/interview/${data.id}`);
    } catch (err: any) {
      console.error("[START_INTERVIEW_ERROR]", err);
      setError(err.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Create Mock Interview</h1>
        <p className="text-neutral-400 mt-2">Configure your AI interviewer to practice exactly what you need.</p>
      </div>

      <div className="space-y-8">
        {/* Domain Selection */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">1. Select Domain</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SelectionCard 
              selected={domain === "dsa"} 
              onClick={() => setDomain("dsa")}
              label="DSA & Algos" 
              icon={<Code className="w-6 h-6 mb-2" />} 
            />
            <SelectionCard 
              selected={domain === "system_design"} 
              onClick={() => setDomain("system_design")}
              label="System Design" 
              icon={<Settings className="w-6 h-6 mb-2" />} 
            />
            <SelectionCard 
              selected={domain === "web_dev"} 
              onClick={() => setDomain("web_dev")}
              label="Web Dev" 
              icon={<FileText className="w-6 h-6 mb-2" />} 
            />
            <SelectionCard 
              selected={domain === "hr"} 
              onClick={() => setDomain("hr")}
              label="HR / Behavioral" 
              icon={<Brain className="w-6 h-6 mb-2" />} 
            />
            <SelectionCard 
              selected={domain === "resume"} 
              onClick={() => setDomain("resume")}
              label="Resume Based" 
              icon={<FileText className="w-6 h-6 mb-2 text-pink-400" />} 
            />
          </div>

          {domain === "resume" && (
            <div className="mt-4 p-4 border border-indigo-500/30 bg-indigo-500/5 rounded-xl space-y-3">
              <Label className="text-white">Select a Resume to Base Interview On</Label>
              {resumes.length === 0 ? (
                <p className="text-sm text-neutral-400">You need to upload or build a resume first.</p>
              ) : (
                <select 
                  className="w-full bg-neutral-900 border border-neutral-800 text-white p-2 rounded-lg"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select your resume...</option>
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.title} {r.jobTitle ? `(${r.jobTitle})` : ""}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </section>

        {/* Difficulty Selection */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">2. Select Difficulty</h2>
          <div className="grid grid-cols-3 gap-4">
            <SelectionCard 
              selected={difficulty === "easy"} 
              onClick={() => setDifficulty("easy")}
              label="Easy" 
              desc="Good for beginners"
            />
            <SelectionCard 
              selected={difficulty === "medium"} 
              onClick={() => setDifficulty("medium")}
              label="Medium" 
              desc="Standard level"
            />
            <SelectionCard 
              selected={difficulty === "hard"} 
              onClick={() => setDifficulty("hard")}
              label="Hard" 
              desc="FAANG style"
            />
          </div>
        </section>

        {/* Type Selection */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">3. Interview Type</h2>
          <div className="grid grid-cols-3 gap-4">
            <SelectionCard 
              selected={type === "chat"} 
              onClick={() => setType("chat")}
              label="Text Chat" 
              icon={<FileText className="w-6 h-6 mb-2" />} 
            />
            <SelectionCard 
              selected={type === "voice"} 
              onClick={() => setType("voice")}
              label="Voice Only" 
              icon={<Mic className="w-6 h-6 mb-2" />} 
            />
            <SelectionCard 
              selected={type === "video"} 
              onClick={() => setType("video")}
              label="Video & Voice" 
              icon={<Video className="w-6 h-6 mb-2" />} 
            />
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-6 border-t border-neutral-800 flex justify-end">
          <Button
            type="button"
            onClick={handleStart}
            disabled={isSubmitting}
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white px-8 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Interview...
              </span>
            ) : "Start Interview"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SelectionCard({ selected, onClick, label, desc, icon }: any) {
  return (
    <div 
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl p-4 border flex flex-col items-center text-center transition-all duration-200 ${
        selected 
          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" 
          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-700 hover:text-neutral-300"
      }`}
    >
      {selected && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-indigo-500" />}
      {icon}
      <span className="font-semibold">{label}</span>
      {desc && <span className="text-xs mt-1 opacity-70">{desc}</span>}
    </div>
  );
}
