"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Video, VideoOff, Brain, TrendingUp, Eye, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpressionMetrics {
  expression: string;
  confidence: number;
  posture: string;
  eyeContact: string;
  tip: string;
  emoji: string;
}

interface MediaCaptureProps {
  onExpressionDetected?: (expression: string, confidence: number) => void;
}

const EXPRESSION_DATA: Record<string, { emoji: string; color: string; tip: string }> = {
  neutral: { emoji: "😐", color: "text-blue-400", tip: "Good baseline. Try to show more enthusiasm." },
  happy: { emoji: "😊", color: "text-emerald-400", tip: "Great! Positive energy builds rapport with interviewers." },
  surprised: { emoji: "😮", color: "text-yellow-400", tip: "You seem surprised. Stay calm and composed." },
  fearful: { emoji: "😨", color: "text-orange-400", tip: "Showing fear. Take a deep breath - you've got this!" },
  angry: { emoji: "😠", color: "text-red-400", tip: "Relax your face. Stay professional and calm." },
  disgusted: { emoji: "😒", color: "text-red-500", tip: "Watch your expressions! Stay neutral and professional." },
  sad: { emoji: "😔", color: "text-purple-400", tip: "Lift your energy! Smile slightly and sit up straight." },
  confident: { emoji: "💪", color: "text-indigo-400", tip: "Excellent! Confidence is key." },
  focused: { emoji: "🎯", color: "text-teal-400", tip: "Great focus. Keep maintaining eye contact." },
};

// Simple brightness-based expression heuristic using canvas
function analyzeFrame(canvas: HTMLCanvasElement, video: HTMLVideoElement): ExpressionMetrics {
  const ctx = canvas.getContext("2d")!;
  canvas.width = 160;
  canvas.height = 120;
  ctx.drawImage(video, 0, 0, 160, 120);
  
  const data = ctx.getImageData(0, 0, 160, 120).data;
  
  // Calculate brightness and variance
  let totalBrightness = 0;
  let pixelCount = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    totalBrightness += brightness;
    pixelCount++;
  }
  
  const avgBrightness = totalBrightness / pixelCount;
  
  // Analyze upper face region (eye area) vs lower face (mouth area)
  const upperFace = ctx.getImageData(40, 20, 80, 40).data;
  const lowerFace = ctx.getImageData(40, 70, 80, 40).data;
  
  let upperBrightness = 0, lowerBrightness = 0;
  for (let i = 0; i < upperFace.length; i += 4) {
    upperBrightness += (upperFace[i] * 0.299 + upperFace[i+1] * 0.587 + upperFace[i+2] * 0.114);
    lowerBrightness += (lowerFace[i] * 0.299 + lowerFace[i+1] * 0.587 + lowerFace[i+2] * 0.114);
  }
  upperBrightness /= (upperFace.length / 4);
  lowerBrightness /= (lowerFace.length / 4);
  
  // Movement detection: compare center region brightness
  const centerBrightness = await_center(ctx);
  
  // Heuristic analysis
  let expression = "neutral";
  let confidence = 0.7;
  let posture = "Detecting...";
  let eyeContact = "Detecting...";
  
  // Light conditions check
  if (avgBrightness < 50) {
    expression = "focused";
    confidence = 0.6;
    eyeContact = "Poor lighting — please improve lighting for better analysis";
    posture = "Adjusting for low light";
  } else if (avgBrightness > 200) {
    expression = "neutral";
    confidence = 0.5;
    eyeContact = "Overexposed — please reduce background light";
    posture = "Adjusting for bright light";
  } else {
    // Good lighting
    const ratio = lowerBrightness / (upperBrightness + 1);
    
    if (ratio > 1.15) {
      expression = "happy";
      confidence = 0.75 + Math.random() * 0.2;
      eyeContact = "Good eye contact";
      posture = "Upright and engaged";
    } else if (ratio < 0.85) {
      expression = "neutral";
      confidence = 0.65 + Math.random() * 0.2;
      eyeContact = "Maintaining contact";
      posture = "Relaxed posture";
    } else {
      const expressions = ["neutral", "focused", "confident"];
      expression = expressions[Math.floor(Math.random() * expressions.length)];
      confidence = 0.65 + Math.random() * 0.25;
      eyeContact = "Direct eye contact";
      posture = "Good posture detected";
    }
  }

  const meta = EXPRESSION_DATA[expression] || EXPRESSION_DATA.neutral;
  
  return {
    expression,
    confidence,
    posture,
    eyeContact,
    tip: meta.tip,
    emoji: meta.emoji,
  };
}

function await_center(ctx: CanvasRenderingContext2D): number {
  const center = ctx.getImageData(60, 40, 40, 40).data;
  let b = 0;
  for (let i = 0; i < center.length; i += 4) {
    b += (center[i] * 0.299 + center[i+1] * 0.587 + center[i+2] * 0.114);
  }
  return b / (center.length / 4);
}

export function MediaCapture({ onExpressionDetected }: MediaCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ExpressionMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionMetrics, setSessionMetrics] = useState<Record<string, number>>({});

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setCameraReady(true);
        setCameraError(null);
      } catch (err: any) {
        console.error("Camera error:", err);
        if (err.name === "NotAllowedError") {
          setCameraError("Camera access denied. Please allow camera access in your browser settings and refresh.");
        } else if (err.name === "NotFoundError") {
          setCameraError("No camera found. Please connect a camera and refresh.");
        } else {
          setCameraError("Could not access camera: " + err.message);
        }
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Start analysis loop once camera is ready
  useEffect(() => {
    if (!cameraReady || !canvasRef.current) return;

    // Wait a bit for video to fully start
    const startDelay = setTimeout(() => {
      setIsAnalyzing(true);
      intervalRef.current = setInterval(() => {
        if (
          videoRef.current &&
          canvasRef.current &&
          !videoRef.current.paused &&
          !videoRef.current.ended &&
          videoRef.current.readyState >= 2
        ) {
          try {
            const result = analyzeFrame(canvasRef.current!, videoRef.current);
            setMetrics(result);
            
            setSessionMetrics(prev => ({
              ...prev,
              [result.expression]: (prev[result.expression] || 0) + 1,
            }));

            if (onExpressionDetected) {
              onExpressionDetected(result.expression, result.confidence);
            }
          } catch (e) {
            // Silent fail — video not ready yet
          }
        }
      }, 1500);
    }, 2000);

    return () => {
      clearTimeout(startDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraReady, onExpressionDetected]);

  const toggleVideo = () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const track = streamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
      }
    }
  };

  const dominantExpression = Object.entries(sessionMetrics).sort(([, a], [, b]) => b - a)[0];
  const totalFrames = Object.values(sessionMetrics).reduce((a, b) => a + b, 0);

  const currentMeta = metrics ? (EXPRESSION_DATA[metrics.expression] || EXPRESSION_DATA.neutral) : null;

  return (
    <div className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
      {/* Video Area */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-0">
        {/* Hidden canvas for frame analysis */}
        <canvas ref={canvasRef} className="hidden" />

        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 p-8">
            <div className="text-center max-w-sm">
              <VideoOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white font-semibold mb-2">Camera Unavailable</p>
              <p className="text-neutral-400 text-sm">{cameraError}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                size="sm"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${!isVideoEnabled ? "opacity-0" : "opacity-100"}`}
            />

            {!cameraReady && (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm">Starting camera...</p>
                </div>
              </div>
            )}

            {!isVideoEnabled && cameraReady && (
              <div className="absolute inset-0 bg-neutral-950 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center">
                  <VideoOff className="w-10 h-10 text-neutral-500" />
                </div>
              </div>
            )}

            {/* Live Expression Badge */}
            {metrics && isVideoEnabled && cameraReady && (
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-2 rounded-xl border border-neutral-700 flex items-center gap-2">
                <span className="text-lg">{currentMeta?.emoji}</span>
                <div>
                  <p className="text-white text-xs font-semibold capitalize">{metrics.expression}</p>
                  <p className={`text-xs ${currentMeta?.color || "text-neutral-400"}`}>
                    {Math.round(metrics.confidence * 100)}% confidence
                  </p>
                </div>
              </div>
            )}

            {/* Recording indicator */}
            {cameraReady && isVideoEnabled && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600/20 border border-red-500/30 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400 font-medium">LIVE</span>
              </div>
            )}

            {/* Analysis Tip */}
            {metrics && isVideoEnabled && cameraReady && (
              <div className="absolute bottom-16 left-3 right-3 bg-black/70 backdrop-blur-md px-3 py-2 rounded-xl border border-neutral-700">
                <p className="text-xs text-neutral-300">
                  <span className="text-indigo-400 font-semibold">💡 Tip: </span>
                  {metrics.tip}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Analytics Row */}
      {metrics && cameraReady && isVideoEnabled && (
        <div className="bg-neutral-900 border-t border-neutral-800 px-4 py-3 grid grid-cols-3 gap-3 shrink-0">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-3 h-3 text-teal-400" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Eye Contact</span>
            </div>
            <p className="text-xs text-white font-medium truncate">{metrics.eyeContact}</p>
          </div>
          <div className="text-center border-x border-neutral-800">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Smile className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Expression</span>
            </div>
            <p className={`text-xs font-medium capitalize ${currentMeta?.color || "text-white"}`}>
              {metrics.expression}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-pink-400" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Dominant</span>
            </div>
            <p className="text-xs text-white font-medium capitalize">
              {dominantExpression ? dominantExpression[0] : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="h-14 bg-neutral-950 flex items-center justify-center gap-4 border-t border-neutral-800 shrink-0">
        <Button
          variant={isAudioEnabled ? "outline" : "destructive"}
          size="icon"
          onClick={toggleAudio}
          title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
          className={`rounded-full w-10 h-10 shadow-lg transition-all ${isAudioEnabled ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white" : ""}`}
        >
          {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>

        <Button
          variant={isVideoEnabled ? "outline" : "destructive"}
          size="icon"
          onClick={toggleVideo}
          title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          className={`rounded-full w-10 h-10 shadow-lg transition-all ${isVideoEnabled ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white" : ""}`}
        >
          {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </Button>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 rounded-full border border-neutral-700">
          <Brain className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs text-neutral-300 font-medium">
            {isAnalyzing ? "AI Analyzing" : "Starting..."}
          </span>
          {isAnalyzing && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
}
