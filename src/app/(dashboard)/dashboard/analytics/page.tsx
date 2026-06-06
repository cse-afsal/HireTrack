import { Card } from "@/components/ui/card";
import { Brain, TrendingUp, Clock, Target, CalendarDays, Award } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const interviewsRaw = await db.interview.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
  
  const interviews = interviewsRaw.map(i => ({
    id: i.id,
    domain: i.domain,
    difficulty: i.difficulty,
    type: i.type,
    score: i.score,
    createdAt: i.createdAt.toISOString()
  }));

  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter(i => i.score !== null);
  const avgScore = completedInterviews.length > 0 
    ? (completedInterviews.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedInterviews.length).toFixed(1)
    : "N/A";

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Performance Analytics</h1>
        <p className="text-neutral-400">Track your interview progress, identify weaknesses, and improve your skills.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-neutral-900 border-neutral-800 p-6 flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
          <div>
            <p className="text-sm font-medium text-neutral-400 mb-1">Total Interviews</p>
            <div className="text-4xl font-bold text-white group-hover:text-indigo-400 transition-colors">
              {totalInterviews}
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <Target className="w-6 h-6 text-indigo-500" />
          </div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-6 flex items-center justify-between group hover:border-emerald-500/50 transition-colors">
          <div>
            <p className="text-sm font-medium text-neutral-400 mb-1">Average Score</p>
            <div className="text-4xl font-bold text-white group-hover:text-emerald-400 transition-colors">
              {avgScore}
              <span className="text-lg text-neutral-500 ml-1">/ 10</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-6 flex items-center justify-between group hover:border-cyan-500/50 transition-colors">
          <div>
            <p className="text-sm font-medium text-neutral-400 mb-1">Hours Practiced</p>
            <div className="text-4xl font-bold text-white group-hover:text-cyan-400 transition-colors">
              {(totalInterviews * 0.75).toFixed(1)}
              <span className="text-lg text-neutral-500 ml-1">hrs</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-cyan-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Performance by Domain
          </h2>
          <div className="space-y-6">
            {["dsa", "system_design", "web_dev", "hr"].map(domain => {
               const domainInterviews = completedInterviews.filter(i => i.domain === domain);
               const domainScore = domainInterviews.length > 0 
                 ? domainInterviews.reduce((a, c) => a + (c.score || 0), 0) / domainInterviews.length 
                 : 0;
               const width = domainScore > 0 ? `${(domainScore / 10) * 100}%` : "0%";
               
               let colorClass = "bg-indigo-500";
               if (domain === "system_design") colorClass = "bg-cyan-500";
               if (domain === "web_dev") colorClass = "bg-emerald-500";
               if (domain === "hr") colorClass = "bg-amber-500";

               return (
                 <div key={domain} className="space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-neutral-300 capitalize">{domain.replace('_', ' ')}</span>
                     <span className="text-neutral-400">{domainScore ? domainScore.toFixed(1) + '/10' : 'No data'}</span>
                   </div>
                   <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden">
                     <div 
                       className={`h-full ${colorClass} transition-all duration-1000 ease-out`} 
                       style={{ width, opacity: domainScore > 0 ? 1 : 0 }}
                     />
                   </div>
                 </div>
               );
            })}
          </div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            Recent History
          </h2>
          <div className="space-y-4">
            {interviews.length === 0 && <p className="text-neutral-500 text-sm">No interviews found. Start your first mock interview today!</p>}
            {interviews.map(interview => (
              <div key={interview.id} className="flex items-center justify-between p-4 rounded-xl bg-neutral-950/50 border border-neutral-800/50 hover:bg-neutral-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${interview.score && interview.score >= 8 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-indigo-500/20 text-indigo-500'}`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium capitalize">{interview.domain.replace('_', ' ')}</h4>
                    <p className="text-xs text-neutral-400 capitalize">{interview.difficulty} • {interview.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {interview.score ? <>{interview.score} <span className="text-xs text-neutral-500">/ 10</span></> : <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">Pending</span>}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {new Date(interview.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
