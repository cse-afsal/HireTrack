import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic, Code, LineChart, Brain } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-indigo-500" />
          <span className="font-bold text-xl tracking-tight">HireTrack</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/register">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="px-6 py-24 md:py-32 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-indigo-400 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            HireTrack AI Engine Beta
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 mt-4">
            Ace your next tech interview with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI precision</span>.
          </h1>
          <p className="text-xl text-neutral-400 mb-10 max-w-2xl">
            Simulate real-world technical interviews with AI-driven voice/video interaction, code execution, and deep evaluation. Land your dream job faster.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-neutral-950 hover:bg-neutral-200 font-bold px-8 h-14 text-lg">
                Start Practicing Free
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white h-14 bg-transparent">
                See How It Works
              </Button>
            </Link>
          </div>
        </section>

        <section id="features" className="px-6 py-24 bg-neutral-900/50 border-y border-neutral-800">
          <div className="max-w-6xl mx-auto">
             <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to succeed</h2>
               <p className="text-neutral-400">Practicing for interviews shouldn't mean just reading books. Experience the real deal.</p>
             </div>
             
             <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard 
                  icon={<Code className="w-6 h-6 text-cyan-400" />}
                  title="Live Coding Environment"
                  description="Write, compile, and run code in Java, Python, and C++ with our Monaco editor and Judge0 integration."
                />
                <FeatureCard 
                  icon={<Mic className="w-6 h-6 text-indigo-400" />}
                  title="Voice & Video Interviews"
                  description="Have real conversations with our AI using WebRTC and Whisper AI for ultra-realistic interview scenarios."
                />
                <FeatureCard 
                  icon={<LineChart className="w-6 h-6 text-emerald-400" />}
                  title="Deep AI Feedback"
                  description="Get domain-wise breakdowns, detailed feedback, and personalized improvement roadmaps after every session."
                />
             </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 border-t border-neutral-800 text-center text-sm text-neutral-500">
        <p>© {new Date().getFullYear()} HireTrack. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-neutral-950 p-8 rounded-2xl border border-neutral-800 flex flex-col items-start text-left hover:border-neutral-700 transition-colors">
      <div className="p-3 bg-neutral-900 rounded-lg mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-neutral-400 leading-relaxed">{description}</p>
    </div>
  );
}
