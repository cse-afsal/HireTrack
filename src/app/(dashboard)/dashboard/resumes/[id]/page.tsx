import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle, Target, Briefcase, FileText } from "lucide-react";
import Link from "next/link";

export default async function ResumePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const resume = await db.resume.findUnique({
    where: { id: params.id, userId: session.user.id }
  });

  if (!resume) {
    notFound();
  }

  const isAnalyzerResult = resume.score !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/resumes" className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{resume.title || "Resume Details"}</h1>
          <p className="text-neutral-400 text-sm">
            {isAnalyzerResult ? "Analysis Report" : "Builder Output"}
          </p>
        </div>
      </div>

      {isAnalyzerResult && (
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-neutral-900 border-neutral-800 p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-neutral-400 font-medium mb-4">Overall Score</h3>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-neutral-800"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${(resume.score || 0) >= 80 ? 'text-emerald-500' : (resume.score || 0) >= 60 ? 'text-yellow-500' : 'text-red-500'}`}
                  strokeWidth="3"
                  strokeDasharray={`${resume.score}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-white">{resume.score}</span>
                <span className="text-xs text-neutral-400">/ 100</span>
              </div>
            </div>
          </Card>

          <Card className="md:col-span-2 bg-neutral-900 border-neutral-800 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Target Role Profile</h3>
            </div>
            <p className="text-neutral-300 text-lg mb-6">{resume.jobTitle || "Not specified"}</p>
            
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Actionable Feedback</h3>
            </div>
            <p className="text-neutral-400 whitespace-pre-line leading-relaxed">
              {resume.feedback || "No feedback generated."}
            </p>
          </Card>
        </div>
      )}

      {!isAnalyzerResult && (
        <Card className="bg-neutral-900 border-neutral-800 p-8 text-center text-neutral-400 flex flex-col items-center justify-center py-20">
          <Briefcase className="w-12 h-12 text-neutral-600 mb-4" />
          <h3 className="text-lg text-white mb-2">Resume Data</h3>
          <p className="max-w-sm">This resume was built via the builder. Preview engine coming soon.</p>
          <Link href={`/dashboard/resumes/builder?id=${resume.id}`} className="mt-6">
            <Button className="bg-neutral-800 hover:bg-neutral-700 text-white">Open in Builder</Button>
          </Link>
        </Card>
      )}

      {resume.content && isAnalyzerResult && (
        <Card className="bg-neutral-950/50 border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-neutral-400" />
            <h3 className="font-medium text-white">Extracted Text Content</h3>
          </div>
          <div className="bg-neutral-900 p-4 rounded-lg font-mono text-xs text-neutral-500 h-64 overflow-y-auto whitespace-pre-wrap">
            {resume.content}
          </div>
        </Card>
      )}
    </div>
  );
}
