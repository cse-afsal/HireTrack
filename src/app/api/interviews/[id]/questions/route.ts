import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/** Domain-specific fallback banks – used when AI fails */
const FALLBACK_BANKS: Record<string, string[]> = {
  dsa: [
    "Welcome! I'm your interviewer today. Could you start by introducing yourself — your name, background, and what draws you to software engineering?",
    "Great! Let's warm up. What is the difference between an array and a linked list, and when would you choose one over the other?",
    "Can you explain what Big O notation means and why it matters when evaluating algorithms?",
    "Walk me through how you would reverse a string without using any built-in reverse function.",
    "What is a stack and a queue? Give a real-world example of each.",
    "How does binary search work, and what is its time complexity?",
    "Explain recursion with a simple example. What is the downside of using recursion?",
    "Describe how you would find all duplicates in an array of integers efficiently.",
    "What is a hash map? How does it handle collisions?",
    "You've done well! For our final question: how would you design an algorithm to detect a cycle in a linked list?",
  ],
  web_dev: [
    "Welcome! Please introduce yourself — your name, your experience with web development, and the technologies you enjoy most.",
    "What is the difference between HTML, CSS, and JavaScript? How do they all work together in a browser?",
    "Explain the concept of the DOM. How does JavaScript interact with it?",
    "What is the difference between let, const, and var in JavaScript?",
    "Can you explain what a REST API is and how HTTP methods like GET, POST, PUT, and DELETE are used?",
    "What is React? Why would you use a component-based framework instead of plain JavaScript?",
    "Explain the concept of state in React. How does useState work?",
    "What is the difference between server-side rendering (SSR) and client-side rendering (CSR)?",
    "How would you optimise a slow-loading web page? Name at least three techniques.",
    "Final question: What is CORS, why does it exist, and how do you resolve a CORS error?",
  ],
  system_design: [
    "Welcome! Please introduce yourself and describe your experience with designing software systems.",
    "What is the difference between horizontal and vertical scaling?",
    "Explain the concept of a load balancer and when you would use one.",
    "What is a CDN (Content Delivery Network) and why would you use it?",
    "Describe the CAP theorem. What trade-offs does it describe?",
    "What is database sharding and why is it useful?",
    "Explain the difference between SQL and NoSQL databases, and give an example of when you'd use each.",
    "How would you design a URL shortening service like Bitly at a high level?",
    "What is message queuing? Give an example of a use case.",
    "Final question: How would you design a system to handle 1 million concurrent users reading and writing data?",
  ],
  hr: [
    "Hello! Let's begin with a classic opener — tell me about yourself. Walk me through your background and what you're looking for.",
    "Why do you want to work in software engineering and what motivates you in your day-to-day learning?",
    "Tell me about a challenging project you worked on. What was your role and what did you learn?",
    "Describe a situation where you disagreed with a team member. How did you handle it?",
    "What are your greatest technical strengths? Give an example of demonstrating one of them.",
    "Where do you see yourself in the next 3 to 5 years professionally?",
    "Tell me about a time you failed at something. What did you learn from that experience?",
    "How do you manage your time when you have multiple deadlines competing against each other?",
    "What questions do you have about our company or the role you are applying for?",
    "Final question: Why should we hire you over other candidates? What makes you uniquely suited for this position?",
  ],
  ai_ml: [
    "Welcome! Please introduce yourself and share your experience or interest in artificial intelligence and machine learning.",
    "What is the difference between supervised and unsupervised learning? Give an example of each.",
    "Explain what a neural network is in simple terms. How does it learn?",
    "What is overfitting in machine learning and how do you prevent it?",
    "What is the difference between classification and regression? Give a real-world example of each.",
    "Explain what a Large Language Model is and how it differs from a traditional search engine.",
    "What is a confusion matrix and what key metrics can you derive from it?",
    "Explain gradient descent. Why is the learning rate important?",
    "What is the bias-variance trade-off?",
    "Final question: How would you approach building a model to detect spam emails? Walk through your end-to-end process.",
  ],
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const interview = await db.interview.findUnique({
      where: { id: params.id, userId: session.user.id },
      include: { resume: true },
    });
    if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

    // If questions already exist, return them
    const existing = await db.question.count({ where: { interviewId: params.id } });
    if (existing > 0) {
      const questions = await db.question.findMany({
        where: { interviewId: params.id },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ questions });
    }

    const domain     = interview.domain;
    const domainLabel = domain.replace(/_/g, " ").toUpperCase();
    const difficulty  = interview.difficulty;
    const resumeCtx   = interview.resume?.content
      ? `\n\nThe candidate's resume:\n"${interview.resume.content.slice(0, 3000)}"\nTailor some questions to their specific experience.`
      : "";

    let questionTexts: string[] = [];

    // ── Try Gemini first ──────────────────────────────────────────────────
    try {
      const model  = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a senior interviewer conducting a REAL ${difficulty.toUpperCase()}-level ${domainLabel} voice interview at a top tech company.${resumeCtx}

Generate EXACTLY 10 interview questions following this structure:
- Q1: "Tell me about yourself" style warm-up intro (greet candidate, ask them to introduce themselves)
- Q2-Q3: Foundational / easy conceptual questions
- Q4-Q5: Intermediate technical or situational questions
- Q6-Q7: Deeper applied/practical questions  
- Q8-Q9: Hard / scenario-based / analytical questions
- Q10: Final closing hard question, end with "This is our last question — good luck!"

Rules:
- Questions must be ${difficulty} difficulty appropriate
- All questions must be suitable for SPOKEN verbal answers (no writing code)
- Be natural, conversational, like a real interviewer
- Do NOT number the questions
- Return ONLY a valid JSON array of exactly 10 strings

Format: ["question 1", "question 2", ..., "question 10"]`;

      const result = await model.generateContent(prompt);
      const raw    = result.response.text().replace(/```json\s*/gi, "").replace(/```/g, "").trim();
      const match  = raw.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          questionTexts = parsed.slice(0, 10).map(String);
        }
      }
    } catch (e) {
      console.warn("[QUESTIONS] Gemini failed, using fallback bank:", e);
    }

    // ── Fallback to hardcoded bank ────────────────────────────────────────
    if (questionTexts.length < 10) {
      const bank = FALLBACK_BANKS[domain] ?? FALLBACK_BANKS.hr;
      questionTexts = bank.slice(0, 10);
      // Pad if needed (shouldn't happen)
      while (questionTexts.length < 10) {
        questionTexts.push("Can you elaborate on your previous answer with a specific example?");
      }
    }

    // ── Persist exactly 10 questions ─────────────────────────────────────
    const questions = [];
    for (const text of questionTexts) {
      const q = await db.question.create({ data: { interviewId: params.id, prompt: text } });
      questions.push(q);
    }

    await db.interview.update({ where: { id: params.id }, data: { status: "IN_PROGRESS" } });

    return NextResponse.json({ questions });
  } catch (err: any) {
    console.error("[GENERATE_QUESTIONS]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
