import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, UploadCloud, FileEdit, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ResumesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return <div>Not authenticated</div>;
  }

  const resumes = await db.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Resume Tools</h1>
        <p className="text-neutral-400">Analyze your existing resume or build a new one customized for modern tech applications.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 border-neutral-800 p-6 flex flex-col h-full hover:border-neutral-700 transition">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
            <UploadCloud className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Resume Analyzer</h2>
          <p className="text-neutral-400 mb-8 flex-1">
            Upload your existing PDF resume. Our AI will analyze its format, keyword optimization, and impact, giving you an ATS score out of 100 with detailed feedback.
          </p>
          <Link href="/dashboard/resumes/analyze">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              Analyze PDF <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-6 flex flex-col h-full hover:border-neutral-700 transition">
          <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6">
            <FileEdit className="w-6 h-6 text-pink-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Resume Builder</h2>
          <p className="text-neutral-400 mb-8 flex-1">
            Build a beautiful, ATS-friendly resume from scratch. Just fill in your details, and we will format it perfectly with our modern dual-column templates.
          </p>
          <Link href="/dashboard/resumes/builder">
            <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
              Create New Resume <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </div>

      <div className="pt-8">
        <h3 className="text-lg font-semibold text-white mb-6">Your Resumes ({resumes.length})</h3>
        
        {resumes.length === 0 ? (
          <div className="text-center py-12 px-4 bg-neutral-950/50 rounded-xl border border-neutral-800 border-dashed">
             <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-800">
                <FileText className="w-8 h-8 text-neutral-500" />
             </div>
             <h4 className="text-white font-medium mb-2">No resumes yet</h4>
             <p className="text-neutral-400 text-sm max-w-sm mx-auto">
                Upload a resume to analyze or build a new one to get started.
             </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className="bg-neutral-900 border-neutral-800 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <h4 className="font-semibold text-white">{resume.title || "Untitled Resume"}</h4>
                  </div>
                  {resume.score !== null && (
                    <span className={`text-xs px-2 py-1 rounded-full ${resume.score >= 80 ? 'bg-emerald-500/10 text-emerald-400' : resume.score >= 60 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                      Score: {resume.score}/100
                    </span>
                  )}
                </div>
                {resume.jobTitle && (
                  <p className="text-sm text-neutral-400 mb-4">{resume.jobTitle}</p>
                )}
                <div className="flex items-center gap-2">
                  {resume.content && (
                     <Link href={`/dashboard/resumes/${resume.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800">
                        View Analysis
                      </Button>
                     </Link>
                  )}
                  {resume.builderData && (
                     <Link href={`/dashboard/resumes/builder?id=${resume.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800">
                        Edit
                      </Button>
                     </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
