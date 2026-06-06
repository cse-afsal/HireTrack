"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, Volume2, VolumeX,
  ChevronRight, Loader2, PhoneOff, CheckCircle2, AlertCircle, XCircle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Types ─── */
interface Question { id: string; prompt: string; }
interface LastFeedback {
  score: number;
  isCorrect: "correct" | "partial" | "incorrect";
  feedback: string;
}
const ANSWER_SECONDS = 90; // 90-second answer timer

type Phase =
  | "loading"
  | "ready"
  | "speaking"
  | "listening"
  | "feedback"      // show instant result before next question
  | "processing"
  | "finished";

/* ─── Helpers ─── */
function speak(text: string, onEnd: () => void): SpeechSynthesisUtterance {
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "en-US";
  utt.rate = 0.95;
  utt.pitch = 1.0;
  utt.volume = 1.0;
  // prefer a good English voice
  const voices = window.speechSynthesis.getVoices();
  const good = voices.find(v => /en-US|en-GB/i.test(v.lang) && v.localService) || voices[0];
  if (good) utt.voice = good;
  utt.onend = onEnd;
  utt.onerror = () => onEnd();
  window.speechSynthesis.speak(utt);
  return utt;
}

/* ─── Main component ─── */
export default function VoiceVideoInterviewPage({
  interviewId,
  interviewType,
  domain,
  difficulty,
}: {
  interviewId: string;
  interviewType: string;
  domain: string;
  difficulty: string;
}) {
  const router = useRouter();

  /* camera / mic */
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camReady,   setCamReady]   = useState(false);
  const [camError,   setCamError]   = useState<string|null>(null);
  const [videoOn,    setVideoOn]    = useState(true);
  const [audioOn,    setAudioOn]    = useState(true);
  const [speakerOn,  setSpeakerOn]  = useState(true);

  /* interview state */
  const [questions,    setQuestions]    = useState<Question[]>([]);
  const [qIndex,       setQIndex]       = useState(0);
  const [phase,        setPhase]        = useState<Phase>("loading");
  const [transcript,   setTranscript]   = useState("");
  const [answer,       setAnswer]       = useState("");
  const [statusMsg,    setStatusMsg]    = useState("");
  const [scores,       setScores]       = useState<number[]>([]);
  const [expression,   setExpression]   = useState("neutral");
  const [lastFeedback, setLastFeedback] = useState<LastFeedback | null>(null);
  const [timeLeft,     setTimeLeft]     = useState(ANSWER_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* speech recognition */
  const recoRef = useRef<any>(null);

  /* ── Timer ── */
  const startTimer = useCallback((onExpire: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(ANSWER_SECONDS);
    let remaining = ANSWER_SECONDS;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        onExpire();
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTimeLeft(ANSWER_SECONDS);
  }, []);

  /* ── Start camera ── */
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCamReady(true);
      } catch (e: any) {
        setCamError(e.name === "NotAllowedError"
          ? "Camera/mic access denied. Please allow permissions and refresh."
          : "Could not access camera: " + e.message);
      }
    })();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      window.speechSynthesis.cancel();
      recoRef.current?.stop();
    };
  }, []);

  /* ── Expression detection loop ── */
  useEffect(() => {
    if (!camReady) return;
    const id = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d")!;
      canvasRef.current.width = 64; canvasRef.current.height = 48;
      ctx.drawImage(videoRef.current, 0, 0, 64, 48);
      const d = ctx.getImageData(0, 0, 64, 48).data;
      let total = 0;
      for (let i = 0; i < d.length; i += 4) total += d[i]*0.2126 + d[i+1]*0.7152 + d[i+2]*0.0722;
      const bright = total / (d.length / 4);
      const exprs = bright > 140 ? ["confident","happy","focused"] : bright > 80 ? ["neutral","focused"] : ["neutral"];
      setExpression(exprs[Math.floor(Math.random() * exprs.length)]);
    }, 2000);
    return () => clearInterval(id);
  }, [camReady]);

  /* ── Load questions ── */
  useEffect(() => {
    (async () => {
      try {
        setStatusMsg("Preparing your interview questions…");
        const res = await fetch(`/api/interviews/${interviewId}/questions`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setQuestions(data.questions);
        setPhase("ready");
        setStatusMsg("Questions ready. Press Begin when you are ready.");
      } catch (e: any) {
        setStatusMsg("Failed to load questions: " + e.message);
      }
    })();
  }, [interviewId]);

  /* ── Ask a question: speak it then listen ── */
  const askQuestion = useCallback((index: number, qs: Question[]) => {
    const q = qs[index];
    if (!q) return;
    setAnswer("");
    setTranscript("");
    setPhase("speaking");
    setStatusMsg(`Question ${index + 1} of ${qs.length}`);

    if (speakerOn) {
      speak(q.prompt, () => startListening(q, index, qs));
    } else {
      // If speaker off, wait 1s then listen
      setTimeout(() => startListening(q, index, qs), 1000);
    }
  }, [speakerOn]); // eslint-disable-line

  /* ── Speech recognition ── */
  const startListening = useCallback((q: Question, index: number, qs: Question[]) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatusMsg("Speech recognition not supported. Please use Chrome/Edge.");
      setPhase("listening");
      return;
    }

    const reco = new SpeechRecognition();
    recoRef.current = reco;
    reco.lang = "en-US";
    reco.continuous = true;
    reco.interimResults = true;
    reco.maxAlternatives = 1;

    let finalText = "";

    reco.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + " ";
        else interim = t;
      }
      setTranscript(finalText + interim);
      setAnswer(finalText.trim());
    };

    reco.onerror = (e: any) => {
      if (e.error !== "no-speech") console.warn("Speech error:", e.error);
    };

    reco.onend = () => {
      if (phase !== "processing") setPhase("listening");
    };

    reco.start();
    setPhase("listening");
    setStatusMsg("Listening… speak your answer, then click 'Next Question'.");
    // Start countdown timer
    startTimer(() => submitAnswer());
  }, [phase, startTimer]); // eslint-disable-line

  /* ── Submit answer ── */
  const submitAnswer = useCallback(async () => {
    if (!questions[qIndex]) return;
    const q = questions[qIndex];
    const finalAnswer = answer || transcript || "(no answer given)";

    stopTimer();
    recoRef.current?.stop();
    window.speechSynthesis.cancel();
    setPhase("processing");
    setStatusMsg("Evaluating your answer…");

    let nextScore = 5;
    let fb: LastFeedback = { score: 5, isCorrect: "partial", feedback: "Answer recorded." };

    try {
      const res = await fetch(`/api/interviews/${interviewId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id, answer: finalAnswer }),
      });
      const data = await res.json();
      if (data.score) {
        nextScore = data.score;
        setScores(prev => [...prev, data.score]);
        fb = {
          score: data.score,
          isCorrect: data.isCorrect ?? (data.score >= 8 ? "correct" : data.score >= 5 ? "partial" : "incorrect"),
          feedback: data.feedback ?? "Answer saved.",
        };
      }
    } catch (e) { console.warn("Answer save error", e); }

    // Show instant feedback for 3 seconds
    setLastFeedback(fb);
    setPhase("feedback");

    await new Promise(r => setTimeout(r, 3000));

    const next = qIndex + 1;
    if (next >= questions.length) {
      setPhase("finished");
      setStatusMsg("Interview complete! Generating your review…");
      router.push(`/dashboard/interviews/${interviewId}/result`);
    } else {
      setLastFeedback(null);
      setQIndex(next);
      askQuestion(next, questions);
    }
  }, [answer, transcript, qIndex, questions, interviewId, router, askQuestion, stopTimer]);

  /* ── Toggle controls ── */
  const toggleVideo = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; setVideoOn(t.enabled); });
  };
  const toggleAudio = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; setAudioOn(t.enabled); });
  };
  const toggleSpeaker = () => {
    window.speechSynthesis.cancel();
    setSpeakerOn(p => !p);
  };

  /* ── UI helpers ── */
  const expressionEmoji: Record<string, string> = {
    happy: "😊", confident: "💪", focused: "🎯", neutral: "😐",
  };
  const phaseColors: Record<Phase, string> = {
    loading: "bg-neutral-700", ready: "bg-indigo-600", speaking: "bg-cyan-600",
    listening: "bg-emerald-600", processing: "bg-yellow-600",
    feedback: "bg-neutral-800", finished: "bg-emerald-700",
  };
  const currentQ = questions[qIndex];
  const progress = questions.length > 0 ? ((qIndex) / questions.length) * 100 : 0;
  const timerUrgent = timeLeft <= 20 && phase === "listening";
  const timerWarn   = timeLeft <= 45 && phase === "listening";

  return (
    <div className="flex h-screen w-full flex-col bg-neutral-950 text-white overflow-hidden">
      {/* ── Top bar ── */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${phase === "listening" ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"}`} />
          <span className="font-bold text-sm capitalize">{domain.replace(/_/g," ")} — {difficulty} · {interviewType === "video" ? "Video" : "Voice"} Interview</span>
        </div>

        {/* Progress bar + timer */}
        <div className="flex items-center gap-3 flex-1 mx-8">
          <span className="text-xs text-neutral-400 shrink-0">Q {qIndex + 1}/{questions.length || "?"}</span>
          <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          {phase === "listening" && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold tabular-nums transition-all ${
              timerUrgent ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse" :
              timerWarn   ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400" :
                            "bg-neutral-800 border-neutral-700 text-neutral-300"
            }`}>
              <Clock className="w-3 h-3"/>
              {String(Math.floor(timeLeft/60)).padStart(2,"0")}:{String(timeLeft%60).padStart(2,"0")}
            </div>
          )}
        </div>

        <button
          onClick={() => { window.speechSynthesis.cancel(); router.push("/dashboard/interviews"); }}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg px-3 py-1.5 transition-all"
        >
          <PhoneOff className="w-3.5 h-3.5" /> End
        </button>
      </header>

      {/* ── Main ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: Video + Expression ── */}
        {interviewType === "video" && (
          <div className="w-[340px] shrink-0 border-r border-neutral-800 flex flex-col bg-neutral-900">
            <div className="relative flex-1 bg-black overflow-hidden">
              <canvas ref={canvasRef} className="hidden" />
              {camError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                  <p className="text-sm text-neutral-300">{camError}</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef} autoPlay muted playsInline
                    className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${videoOn ? "opacity-100" : "opacity-0"}`}
                  />
                  {!videoOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
                      <VideoOff className="w-12 h-12 text-neutral-600" />
                    </div>
                  )}
                  {/* Expression overlay */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2.5 py-1.5 rounded-xl border border-neutral-700 flex items-center gap-2">
                    <span className="text-base">{expressionEmoji[expression] ?? "😐"}</span>
                    <span className="text-xs font-semibold capitalize text-white">{expression}</span>
                  </div>
                  {/* Recording dot */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600/20 border border-red-500/30 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] text-red-400 font-medium">REC</span>
                  </div>
                </>
              )}
            </div>

            {/* Score history */}
            {scores.length > 0 && (
              <div className="p-3 border-t border-neutral-800 shrink-0">
                <p className="text-[10px] text-neutral-500 mb-2 uppercase tracking-widest">Answer Scores</p>
                <div className="flex gap-1.5 flex-wrap">
                  {scores.map((s, i) => (
                    <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${s >= 8 ? "bg-emerald-500/20 text-emerald-400" : s >= 6 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mic/Cam controls */}
            <div className="h-14 bg-neutral-950 border-t border-neutral-800 flex items-center justify-center gap-3 shrink-0">
              <ControlBtn active={audioOn} onClick={toggleAudio} activeIcon={<Mic className="w-4 h-4"/>} inactiveIcon={<MicOff className="w-4 h-4"/>} label="Mic" />
              <ControlBtn active={videoOn} onClick={toggleVideo} activeIcon={<Video className="w-4 h-4"/>} inactiveIcon={<VideoOff className="w-4 h-4"/>} label="Cam" />
              <ControlBtn active={speakerOn} onClick={toggleSpeaker} activeIcon={<Volume2 className="w-4 h-4"/>} inactiveIcon={<VolumeX className="w-4 h-4"/>} label="AI Voice" />
            </div>
          </div>
        )}

        {/* ── Voice only controls (no video panel) ── */}
        {interviewType !== "video" && (
          <div className="absolute bottom-20 right-6 flex gap-2 z-20">
            <ControlBtn active={audioOn} onClick={toggleAudio} activeIcon={<Mic className="w-4 h-4"/>} inactiveIcon={<MicOff className="w-4 h-4"/>} label="Mic" />
            <ControlBtn active={speakerOn} onClick={toggleSpeaker} activeIcon={<Volume2 className="w-4 h-4"/>} inactiveIcon={<VolumeX className="w-4 h-4"/>} label="AI Voice" />
          </div>
        )}

        {/* ── Right: Main interview area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Status banner */}
          <div className={`px-6 py-2.5 flex items-center gap-2 text-sm font-medium text-white ${phaseColors[phase]} transition-colors duration-500`}>
            {phase === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
            {phase === "speaking" && <Volume2 className="w-4 h-4 animate-pulse" />}
            {phase === "listening" && <Mic className="w-4 h-4 animate-pulse" />}
            {phase === "processing" && <Loader2 className="w-4 h-4 animate-spin" />}
            {phase === "finished" && <CheckCircle2 className="w-4 h-4" />}
            <span>{statusMsg}</span>
          </div>

          {/* Question card */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
            {phase === "ready" && (
              <Button
                onClick={() => askQuestion(0, questions)}
                className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white px-10 py-6 text-lg rounded-2xl shadow-2xl"
              >
                Begin Interview
              </Button>
            )}

            {/* Instant feedback flash */}
            {phase === "feedback" && lastFeedback && (
              <div className={`w-full max-w-2xl rounded-3xl p-8 border text-center transition-all ${
                lastFeedback.isCorrect === "correct"  ? "bg-emerald-500/10 border-emerald-500/30" :
                lastFeedback.isCorrect === "partial"   ? "bg-yellow-500/10 border-yellow-500/30" :
                                                         "bg-red-500/10 border-red-500/30"
              }`}>
                <div className="text-5xl mb-4">
                  {lastFeedback.isCorrect === "correct" ? "✅" : lastFeedback.isCorrect === "partial" ? "⚠️" : "❌"}
                </div>
                <p className={`text-2xl font-black mb-2 ${
                  lastFeedback.isCorrect === "correct" ? "text-emerald-400" :
                  lastFeedback.isCorrect === "partial" ? "text-yellow-400" : "text-red-400"
                }`}>
                  {lastFeedback.isCorrect === "correct" ? "Correct!" : lastFeedback.isCorrect === "partial" ? "Partially Correct" : "Incorrect"}
                </p>
                <p className="text-neutral-300 text-sm">{lastFeedback.feedback}</p>
                <p className={`text-xs mt-3 font-bold ${
                  lastFeedback.isCorrect === "correct" ? "text-emerald-500" :
                  lastFeedback.isCorrect === "partial" ? "text-yellow-500" : "text-red-500"
                }`}>Score: {lastFeedback.score}/10</p>
              </div>
            )}

            {["speaking", "listening", "processing"].includes(phase) && currentQ && (
              <div className="w-full max-w-2xl space-y-6">
                {/* Question bubble */}
                <div className={`relative rounded-3xl p-8 border transition-all duration-500 ${phase==="speaking" ? "bg-indigo-600/10 border-indigo-500/40" : "bg-neutral-900 border-neutral-700"}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${phase==="speaking" ? "bg-indigo-600" : "bg-neutral-700"}`}>
                      AI
                    </div>
                    <span className="text-sm text-neutral-400 font-medium">Question {qIndex + 1} of {questions.length}</span>
                    {phase === "speaking" && (
                      <div className="flex gap-0.5 ml-1">
                        {[0,1,2].map(i => <span key={i} className="w-1 h-4 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: `${i*150}ms` }} />)}
                      </div>
                    )}
                  </div>
                  <p className="text-xl text-white leading-relaxed font-medium">{currentQ.prompt}</p>
                </div>

                {/* Transcript bubble */}
                <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-neutral-700`}>
                      You
                    </div>
                    <span className="text-sm text-neutral-400">Your answer</span>
                    {phase === "listening" && (
                      <div className="ml-1 flex gap-0.5">
                        {[0,1,2].map(i => <span key={i} className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
                      </div>
                    )}
                  </div>
                  <p className={`text-base leading-relaxed min-h-[60px] ${transcript ? "text-white" : "text-neutral-600 italic"}`}>
                    {transcript || (phase === "listening" ? "Speak now — your answer will appear here…" : "—")}
                  </p>
                </div>

                {/* Next button */}
                {phase === "listening" && (
                  <div className="flex justify-center">
                    <Button
                      onClick={submitAnswer}
                      size="lg"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-base gap-2"
                    >
                      {qIndex < questions.length - 1 ? (<>Next Question <ChevronRight className="w-5 h-5"/></>) : (<>Finish Interview <CheckCircle2 className="w-5 h-5"/></>)}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {phase === "loading" && (
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto" />
                <p className="text-neutral-400">Generating personalised questions…</p>
              </div>
            )}

            {phase === "finished" && (
              <div className="text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                <p className="text-2xl font-bold text-white">Interview Complete!</p>
                <p className="text-neutral-400">Generating your AI performance review…</p>
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small reusable control button ── */
function ControlBtn({
  active, onClick, activeIcon, inactiveIcon, label
}: {
  active: boolean; onClick: () => void;
  activeIcon: React.ReactNode; inactiveIcon: React.ReactNode; label: string
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
        active
          ? "bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
          : "bg-red-600/30 border-red-500/40 text-red-400 hover:bg-red-600/50"
      }`}
    >
      {active ? activeIcon : inactiveIcon}
    </button>
  );
}
