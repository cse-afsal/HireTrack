import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Crown, Check } from "lucide-react";
import { db } from "@/lib/db";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  const user = await db.user.findUnique({
    where: { id: session?.user?.id }
  });

  const isPro = user?.plan === "PRO";

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-neutral-400 mt-1">Manage your account settings and subscription preferences.</p>
      </div>

      <div className="grid gap-8">
        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-3xl font-bold text-indigo-400">
               {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{user?.name || "Anonymous User"}</h3>
              <p className="text-neutral-400">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="border-neutral-700 text-white hover:bg-neutral-800">Edit Profile</Button>
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Subscription Plan</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Tier */}
            <Card className={`bg-neutral-900 border-neutral-800 p-6 relative ${!isPro ? 'ring-2 ring-indigo-500' : ''}`}>
              {!isPro && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">CURRENT PLAN</div>}
              <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
              <div className="text-3xl font-extrabold text-white mb-6">$0<span className="text-lg font-medium text-neutral-500">/month</span></div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-neutral-300">
                  <Check className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> 3 mock interviews per month
                </li>
                <li className="flex items-center text-sm text-neutral-300">
                  <Check className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> Basic text feedback
                </li>
              </ul>
              
              <Button disabled={!isPro} variant="outline" className="w-full border-neutral-700 text-white hover:bg-neutral-800">
                 {!isPro ? "Current Plan" : "Downgrade to Basic"}
              </Button>
            </Card>

            {/* Pro Tier */}
            <Card className={`bg-neutral-900 border-neutral-800 p-6 relative ${isPro ? 'ring-2 ring-indigo-500' : ''}`}>
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-4 pr-6">
                 <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-indigo-400/30 flex items-center gap-1">
                   <Crown className="w-3 h-3" />RECOMMENDED
                 </div>
              </div>
              {isPro && <div className="absolute top-0 left-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg rounded-tl-lg">CURRENT PLAN</div>}

              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <div className="text-3xl font-extrabold text-white mb-6">$19<span className="text-lg font-medium text-neutral-500">/month</span></div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-neutral-300">
                  <Check className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> Unlimited mock interviews
                </li>
                <li className="flex items-center text-sm text-neutral-300">
                  <Check className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> Deep AI analytics & Roadmap
                </li>
                <li className="flex items-center text-sm text-neutral-300">
                  <Check className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> Voice & Video real-time interaction
                </li>
              </ul>
              
              <Button disabled={isPro} className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white border-0">
                 {isPro ? "Current Plan" : "Upgrade to Pro"}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
