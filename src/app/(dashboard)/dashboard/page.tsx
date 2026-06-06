import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Award, Target, Plus, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const userId = session?.user?.id;

  // Fetch db stats
  const interviews = await db.interview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter((i) => i.status === "COMPLETED");
  
  const averageScore = completedInterviews.length > 0 
    ? Math.round(completedInterviews.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedInterviews.length)
    : 0;

  const questionsAnswered = await db.question.count({
    where: {
      interview: {
        userId,
      },
      userAnswer: {
        not: null
      }
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
          <p className="text-neutral-400 mt-1">Welcome back, {session?.user?.name || "User"}. Here's your progress.</p>
        </div>
        <Link href="/dashboard/interviews/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-11 px-8">
            <Plus className="w-5 h-5 mr-2" />
            Start Mock Interview
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Interviews" value={totalInterviews.toString()} icon={<PlayCircle className="w-5 h-5 text-indigo-400" />} />
        <MetricCard title="Average Score" value={averageScore > 0 ? `${averageScore}%` : "--"} icon={<Award className="w-5 h-5 text-yellow-400" />} />
        <MetricCard title="Questions Answered" value={questionsAnswered.toString()} icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} />
        <MetricCard title="Time Spent" value={`${totalInterviews > 0 ? '~' + totalInterviews : 0}h`} icon={<Clock className="w-5 h-5 text-cyan-400" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Recent Interviews</h3>
              <Link href="/dashboard/interviews" className="text-sm text-indigo-400 hover:text-indigo-300">View all</Link>
            </div>
            
            {interviews.length === 0 ? (
              <div className="text-center py-12 md:py-16 px-4 bg-neutral-950/50 rounded-xl border border-neutral-800 border-dashed">
                 <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-800">
                    <PlayCircle className="w-8 h-8 text-neutral-500" />
                 </div>
                 <h4 className="text-white font-medium mb-2">No interviews yet</h4>
                 <p className="text-neutral-400 text-sm max-w-sm mx-auto mb-6">
                    Start your first mock interview to get an AI-powered assessment of your skills.
                 </p>
                 <Link href="/dashboard/interviews/new">
                   <Button variant="outline" className="border-neutral-700 text-white hover:bg-neutral-800">
                      Take your first interview
                   </Button>
                 </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {interviews.slice(0, 3).map((interview) => (
                  <Link href={`/interview/${interview.id}`} key={interview.id}>
                    <div className="flex items-center justify-between bg-neutral-950 p-4 rounded-lg border border-neutral-800 hover:border-neutral-700 transition">
                      <div>
                        <h4 className="text-white font-medium capitalize">{interview.domain} Interview</h4>
                        <p className="text-sm text-neutral-400 capitalize">{interview.type} • {interview.difficulty}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${interview.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          {interview.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-800 p-6 flex flex-col h-full">
            <h3 className="text-lg font-semibold text-white mb-2">Target Role Breakdown</h3>
            <p className="text-sm text-neutral-400 mb-6">Your performance mapped against industry standard expectations.</p>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
               <Target className="w-12 h-12 text-neutral-600 mb-4" />
               <p className="text-sm text-neutral-500">Not enough data to generate insights.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card className="bg-neutral-900 border-neutral-800 p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-neutral-400">{title}</h4>
        <div className="p-2 bg-neutral-950 rounded-md border border-neutral-800">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
    </Card>
  );
}
