"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileVideo, LineChart, Settings, Brain, Crown, FileText } from "lucide-react";
import { Session } from "next-auth";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-indigo-400"
  },
  {
    label: "Interviews",
    icon: FileVideo,
    href: "/dashboard/interviews",
    color: "text-cyan-400"
  },
  {
    label: "Analytics",
    icon: LineChart,
    href: "/dashboard/analytics",
    color: "text-emerald-400"
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
    color: "text-neutral-400"
  },
  {
    label: "Resumes",
    icon: FileText,
    href: "/dashboard/resumes",
    color: "text-pink-400"
  }
];

export function Sidebar({ user }: { user: Session["user"] }) {
  const pathname = usePathname();

  return (
    <div className="w-64 flex flex-col bg-neutral-950 border-r border-neutral-800">
      <div className="h-16 flex items-center px-6 border-b border-neutral-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Brain className="w-7 h-7 text-indigo-500" />
          <span className="font-bold text-lg tracking-tight">HireTrack</span>
        </Link>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-1 px-3">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              pathname === route.href
                ? "bg-neutral-900 border border-neutral-800 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
            )}
          >
            <route.icon className={cn("w-5 h-5", route.color)} />
            {route.label}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-neutral-800">
        <div className="bg-gradient-to-tr from-indigo-900/40 to-indigo-600/20 rounded-xl p-4 border border-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <Crown className="w-6 h-6 text-indigo-400/20" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Upgrade to Pro</h4>
          <p className="text-xs text-neutral-400 mb-3">
            Unlimited AI interviews and detailed analytics.
          </p>
          <button className="w-full text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 py-2 rounded-lg text-white transition-colors">
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}
