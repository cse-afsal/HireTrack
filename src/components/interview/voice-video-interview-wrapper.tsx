"use client";

import dynamic from "next/dynamic";

// Lazy-load so Web Speech API (browser-only) is never imported on the server
const VoiceVideoInterviewDynamic = dynamic(
  () => import("./voice-video-interview"),
  { ssr: false, loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-950">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-neutral-400 text-sm">Starting interview room…</p>
      </div>
    </div>
  )}
);

interface Props {
  interviewId: string;
  interviewType: string;
  domain: string;
  difficulty: string;
}

export function VoiceVideoInterviewPage(props: Props) {
  return <VoiceVideoInterviewDynamic {...props} />;
}
