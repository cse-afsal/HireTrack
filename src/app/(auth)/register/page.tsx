"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Something went wrong");
      }

      router.push("/login");
    } catch (error: any) {
      setError(error.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-neutral-950">
      <div className="flex items-center justify-center p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Create an account
            </h1>
            <p className="text-sm text-neutral-400">
              Enter your details below to create your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-neutral-900 border-neutral-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-neutral-900 border-neutral-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-neutral-900 border-neutral-800 text-white"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
          </form>

          <p className="px-8 text-center text-sm text-neutral-400">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-end bg-zinc-900 border-l border-neutral-800 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-cyan-500/10 mix-blend-multiply" />
        <div className="absolute top-12 left-12 flex items-center gap-2">
          <Brain className="w-8 h-8 text-cyan-400" />
          <span className="font-bold text-2xl tracking-tight">HireTrack</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-4">Start your journey to success.</h2>
          <p className="text-lg text-neutral-400">
            Join thousands of developers who have aced their technical interviews using our AI mock interview platform.
          </p>
          <ul className="mt-8 space-y-3">
             <li className="flex items-center text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mr-3" />
                Real-world coding environments
             </li>
             <li className="flex items-center text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mr-3" />
                Dynamic AI-driven feedback
             </li>
             <li className="flex items-center text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mr-3" />
                Performance tracking & analytics
             </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
