"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Bell } from "lucide-react";
import { Session } from "next-auth";
import Image from "next/image";

export function Header({ user }: { user: Session["user"] }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger could go here */}
      </div>

      <div className="flex items-center gap-4">
        <button className="text-neutral-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-neutral-800">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold leading-none text-white">{user?.name || "User"}</span>
            <span className="text-xs text-neutral-400 mt-1">{user?.email}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center text-indigo-400 font-bold">
            {user?.image ? (
              <Image src={user.image} alt={user.name || "User"} width={36} height={36} />
            ) : (
               user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/' })} className="text-neutral-400 hover:text-white hover:bg-neutral-900 ml-2">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
