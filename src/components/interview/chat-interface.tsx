"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, User, Bot, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

interface ChatInterfaceProps {
  interviewId: string;
  initialQuestions: any[];
  interviewType?: string;
}

export function ChatInterface({ interviewId, initialQuestions, interviewType = "chat" }: ChatInterfaceProps) {
  // Convert DB questions into Message array format
  const initialMessages: Message[] = [];
  initialQuestions.forEach((q) => {
    initialMessages.push({
      id: `ai-${q.id}`,
      role: "ai",
      content: q.prompt,
    });
    if (q.userAnswer) {
      initialMessages.push({
        id: `usr-${q.id}`,
        role: "user",
        content: q.userAnswer,
      });
    }
  });

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isComplete]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userContent = input;
    const tempId = Date.now().toString();

    // Add user message optimistically
    const newMessage: Message = { id: `temp-${tempId}`, role: "user", content: userContent };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(`/api/interviews/${interviewId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: userContent }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data = await res.json();
      
      // We know this succeeded. Now add the AI's response.
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${data.nextQuestion.id}`,
          role: "ai",
          content: data.nextQuestion.prompt,
        }
      ]);

      if (data.isComplete) {
        setIsComplete(true);
      }

      if (interviewType !== "chat" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(data.nextQuestion.prompt);
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error(error);
      // Revert if error
      setMessages((prev) => prev.filter(m => m.id !== `temp-${tempId}`));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      <div className="h-14 border-b border-neutral-800 flex items-center px-6 shrink-0 bg-neutral-900/50">
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="font-medium text-sm text-white">Live Interview Session</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "ai" ? "bg-indigo-600" : "bg-neutral-800"}`}>
              {msg.role === "ai" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
               <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
               <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-neutral-800 bg-neutral-950 shrink-0">
         {isComplete ? (
           <div className="flex flex-col items-center justify-center py-4 space-y-4">
             <span className="text-emerald-500 font-medium">Interview Completed</span>
             <Button 
               onClick={() => window.location.href = `/dashboard/interviews/${interviewId}/result`}
               className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 rounded-xl"
             >
               View Results
             </Button>
           </div>
         ) : (
           <>
             <form 
               onSubmit={(e) => { e.preventDefault(); handleSend(); }}
               className="relative flex items-end gap-2 max-w-4xl mx-auto"
             >
               <textarea 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === "Enter" && !e.shiftKey) {
                     e.preventDefault();
                     handleSend();
                   }
                 }}
                 placeholder="Type your response or think out loud..."
                 className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3.5 text-sm md:text-base text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-h-[52px] max-h-[200px]"
                 rows={1}
                 style={{ height: "auto" }}
               />
               <Button type="submit" disabled={!input.trim() || isTyping} className="h-[52px] w-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                 <Send className="w-5 h-5" />
               </Button>
             </form>
             <div className="text-center mt-3">
               <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Press Enter to send, Shift+Enter for new line</span>
             </div>
           </>
         )}
      </div>
    </div>
  );
}
