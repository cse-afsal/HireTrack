import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { VoiceVideoInterviewPage } from "@/components/interview/voice-video-interview-wrapper";
import { ChatInterface } from "@/components/interview/chat-interface";
import { CodeEditor } from "@/components/interview/code-editor";

export default async function InterviewRoomPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const interview = await db.interview.findUnique({
    where: { id: params.id, userId: session.user.id },
    include: {
      questions: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!interview) notFound();

  /* Voice / Video interviews → dedicated full-screen UI */
  if (interview.type === "voice" || interview.type === "video") {
    return (
      <VoiceVideoInterviewPage
        interviewId={interview.id}
        interviewType={interview.type}
        domain={interview.domain}
        difficulty={interview.difficulty}
      />
    );
  }

  /* Text (chat) interview → classic layout */
  return (
    <div className="flex flex-col h-screen w-full">
      <header className="h-14 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/interviews">
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white hover:bg-neutral-900">
              <ChevronLeft className="w-4 h-4 mr-1" /> Exit
            </Button>
          </Link>
          <div className="h-4 w-px bg-neutral-800" />
          <span className="text-sm font-semibold text-white capitalize">
            {interview.domain.replace("_", " ")} Text Interview
          </span>
        </div>
        <Link href={`/dashboard/interviews/${interview.id}/result`}>
          <Button size="sm" variant="outline" className="border-red-900/50 text-red-500 hover:bg-red-500/10 hover:text-red-400 h-8 text-xs">
            End & Review
          </Button>
        </Link>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[450px] shrink-0 border-r border-neutral-800">
          <ChatInterface
            interviewId={interview.id}
            initialQuestions={interview.questions}
            interviewType={interview.type}
          />
        </div>
        <div className="flex-1 min-w-0 bg-[#1e1e1e]">
          <CodeEditor language="python" initialCode={"# Write your solution here\n"} />
        </div>
      </div>
    </div>
  );
}
