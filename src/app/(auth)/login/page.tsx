"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid credentials");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-neutral-950">
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 border-r border-neutral-800 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-500/10 mix-blend-multiply" />
        <div className="relative z-10 flex items-center gap-2">
          <Brain className="w-8 h-8 text-indigo-500" />
          <span className="font-bold text-2xl tracking-tight">HireTrack</span>
        </div>
        <div className="relative z-10">
          <blockquote className="space-y-4">
            <p className="text-xl font-medium tracking-tight">
              "HireTrack completely transformed how I prepared for my technical interviews. The AI feedback felt exactly like a real MAANG interviewer."
            </p>
            <footer className="text-sm text-neutral-400">
              — Alex J., Software Engineer @ TechCorp
            </footer>
          </blockquote>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-sm text-neutral-400">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-neutral-950 px-2 text-neutral-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <Button variant="outline" type="button" onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="w-full bg-transparent border-neutral-800 text-white hover:bg-neutral-900 hover:text-white">
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true" focusable="false">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
              </svg>
              Google
            </Button>
            <Button 
              variant="outline" 
              type="button" 
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                try {
                  const res = await signIn("credentials", { isGuest: "true", redirect: false });
                  if (!res?.error) {
                    router.push("/dashboard");
                    router.refresh();
                  } else {
                    setError("Guest login failed");
                  }
                } catch(err) {
                  setError("A network error occurred");
                } finally {
                  setIsLoading(false);
                }
              }} 
              className="w-full bg-transparent border-neutral-800 text-white hover:bg-neutral-900 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Continue as Guest
            </Button>
          </div>

          <p className="px-8 text-center text-sm text-neutral-400">
            Don't have an account?{" "}
            <Link href="/register" className="underline underline-offset-4 hover:text-white">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
