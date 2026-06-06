import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * POST /api/interviews/[id]/answer
 * Body: { questionId, answer }
 * Deeply evaluates the answer for correctness, scores 1-10,
 * and stores: score, feedback, isCorrect ("correct"|"partial"|"incorrect")
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { questionId, answer } = await req.json();
    if (!questionId || !answer) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const question = await db.question.findUnique({
      where: { id: questionId },
      include: { interview: true },
    });
    if (!question || question.interview.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Skip scoring for intro "tell me about yourself" (first question)
    const isIntroQuestion =
      /tell me about yourself|introduce yourself|walk me through your background/i.test(question.prompt);

    let score      = 7;
    let feedback   = "Answer recorded.";
    let isCorrect  = "partial";
    let modelAnswer = "";

    if (isIntroQuestion) {
      // Intro question: just check confidence and completeness
      score     = answer.trim().split(/\s+/).length > 20 ? 8 : 6;
      feedback  = "Good introduction! Make sure to include your name, background, key skills, and motivation.";
      isCorrect = score >= 7 ? "correct" : "partial";
      modelAnswer = "A strong intro covers: name, education/background, key technical skills, a notable project, and why you want this role.";
    } else {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const evalPrompt = `You are a strict technical interviewer evaluating a candidate's spoken answer.

Question asked: "${question.prompt}"
Candidate's answer: "${answer.slice(0, 1200)}"
Interview difficulty: ${question.interview.difficulty}

Evaluate this answer carefully:
1. Is the answer technically correct? Check for factual errors, missing key concepts, misconceptions.
2. Score from 1-10 (10 = perfect, 7 = good but incomplete, 4 = partially correct, 1 = wrong/no answer)
3. Classify: "correct" (score 8-10), "partial" (score 5-7), or "incorrect" (score 1-4)
4. Give ONE concise feedback sentence (max 25 words) pointing out the main gap or praising the key strength
5. Give a brief "model answer" (1-2 sentences: the key points a perfect answer should cover)

Return ONLY valid JSON:
{
  "score": <1-10>,
  "isCorrect": "correct" | "partial" | "incorrect",
  "feedback": "<one sentence>",
  "modelAnswer": "<what a correct answer should include>"
}`;

        const result = await model.generateContent(evalPrompt);
        const raw    = result.response.text().replace(/```json\s*/gi, "").replace(/```/g, "").trim();
        const m      = raw.match(/\{[\s\S]*\}/);
        if (m) {
          const parsed   = JSON.parse(m[0]);
          score          = Math.round(Math.max(1, Math.min(10, parsed.score ?? 6)));
          feedback       = parsed.feedback    ?? feedback;
          isCorrect      = parsed.isCorrect   ?? (score >= 8 ? "correct" : score >= 5 ? "partial" : "incorrect");
          modelAnswer    = parsed.modelAnswer ?? "";
          // Normalise isCorrect
          if (!["correct","partial","incorrect"].includes(isCorrect)) {
            isCorrect = score >= 8 ? "correct" : score >= 5 ? "partial" : "incorrect";
          }
        }
      } catch (e) {
        console.warn("[ANSWER] Gemini eval failed:", e);
        // Heuristic fallback
        const wordCount = answer.trim().split(/\s+/).length;
        score     = wordCount < 5 ? 2 : wordCount < 20 ? 5 : 7;
        isCorrect = score >= 8 ? "correct" : score >= 5 ? "partial" : "incorrect";
        feedback  = "Answer recorded — AI evaluation temporarily unavailable.";
      }
    }

    // Store in DB — use feedback field to store JSON with all data
    const fullFeedback = JSON.stringify({ feedback, isCorrect, modelAnswer });

    await db.question.update({
      where: { id: questionId },
      data: { userAnswer: answer, score, feedback: fullFeedback },
    });

    return NextResponse.json({ ok: true, score, feedback, isCorrect, modelAnswer });
  } catch (err: any) {
    console.error("[ANSWER_ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
