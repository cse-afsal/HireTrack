import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { domain, difficulty, type, resumeId } = await req.json();

    if (!domain || !difficulty || !type) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    let resumeContext = "";
    if (domain === "resume" && resumeId) {
      const resume = await db.resume.findUnique({ where: { id: resumeId, userId: session.user.id } });
      if (resume?.content) {
        resumeContext = `The candidate's resume content is:\n${resume.content}\nTheir job title is ${resume.jobTitle || 'unspecified'}. Based on this resume, ask them a highly specific technical or behavioral question related to their experience.`;
      }
    }

    // Create the interview
    const interview = await db.interview.create({
      data: {
        userId: session.user.id,
        domain,
        difficulty,
        type,
        status: "IN_PROGRESS",
        resumeId: resumeId || null,
      },
    });

    // Create the first initial question prompt based on the domain
    let prompt = "Let's start the interview.";
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const systemPrompt = `You are an expert technical interviewer at a top tech company. 
You are conducting a ${difficulty} level interview in the domain of ${domain.toUpperCase().replace('_', ' ')}.
${resumeContext}
Your task right now is to introduce yourself briefly and ask the very first interview question. 
Make the question appropriate for a ${difficulty} difficulty level. Be professional, concise, and do not provide the answer.`;
      
      const result = await model.generateContent(systemPrompt);
      const aiResponse = result.response.text();
      prompt = aiResponse || prompt;
    } catch (aiError) {
      console.warn("Gemini generation failed, falling back to default prompts", aiError);
      if (domain === "dsa") {
        prompt = "Let's start with a Data Structures & Algorithms question. Can you implement a function to validate a binary search tree? Please explain your approach.";
      } else if (domain === "system_design") {
        prompt = "Let's begin the System Design interview. How would you approach designing a scalable URL shortener service like Bitly?";
      } else if (domain === "web_dev") {
        prompt = "Welcome to the Web Development interview. Can you explain the difference between Server-Side Rendering (SSR) and Client-Side Rendering (CSR), and when you would use each?";
      } else if (domain === "hr") {
        prompt = "Let's start the Behavioral interview. Tell me about a time you had a conflict with a teammate and how you resolved it.";
      }
    }

    await db.question.create({
      data: {
        interviewId: interview.id,
        prompt,
      },
    });

    return NextResponse.json(interview);
  } catch (error: any) {
    console.log("[INTERVIEW_CREATE_ERROR]", error);
    return new NextResponse(error.message || String(error), { status: 500 });
  }
}
