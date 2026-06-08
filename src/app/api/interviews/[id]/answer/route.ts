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
 *
 * Scoring rules:
 *   - "correct"   (score 8–10) → full score awarded
 *   - "partial"   (score 5–7)  → score awarded (partial credit)
 *   - "incorrect" (score 1–4)  → 0 marks (not respected in totals)
 *   - Skipped questions → handled by /skip endpoint → 0 marks
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

    /* ── Personal questions: check for confidence/completeness only ── */
    const isPersonalQuestion =
      /tell me about yourself|introduce yourself|walk me through your background|where do you see yourself|3.?5 years|career goals/i.test(question.prompt);

    let score      = 7;
    let feedback   = "Answer recorded.";
    let isCorrect  = "partial";
    let modelAnswer = question.modelAnswer ?? "";

    if (isPersonalQuestion) {
      const wordCount = answer.trim().split(/\s+/).length;
      score     = wordCount > 30 ? 8 : wordCount > 15 ? 6 : 4;
      feedback  = wordCount > 30
        ? "Good, detailed personal introduction! Strong answers cover background, key skills, and genuine motivation."
        : "Try to be more detailed — cover your background, key technical skills, and what excites you about the opportunity.";
      isCorrect = score >= 8 ? "correct" : score >= 5 ? "partial" : "incorrect";
    } else {
      /* ── Technical / behavioural question: AI evaluation ── */
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const evalPrompt = `You are a strict technical interviewer evaluating a candidate's spoken answer.

Question asked: "${question.prompt}"
Candidate's answer: "${answer.slice(0, 1200)}"
Interview difficulty: ${question.interview.difficulty}

Evaluate this answer:
1. Is the answer technically correct? Check for factual errors, missing key concepts, misconceptions.
2. Score from 1–10 (10 = perfect, 8–9 = correct, 5–7 = partially correct, 1–4 = wrong or empty)
3. Classify: "correct" (score 8–10), "partial" (score 5–7), or "incorrect" (score 1–4)
4. Give ONE concise feedback sentence (max 30 words) pointing out the main gap or praising the key strength.
5. Provide the ideal model answer in 1–2 sentences covering the key points a correct answer must include.

IMPORTANT scoring rule: Only award score >= 8 if the answer is genuinely correct and covers key concepts.
For ${question.interview.difficulty.toUpperCase()} difficulty, be appropriately strict.

Return ONLY valid JSON (no markdown code blocks):
{
  "score": <1-10 integer>,
  "isCorrect": "correct" | "partial" | "incorrect",
  "feedback": "<one sentence>",
  "modelAnswer": "<key points a correct answer should cover>"
}`;

        const result = await model.generateContent(evalPrompt);
        const raw    = result.response.text().replace(/```json\s*/gi, "").replace(/```/g, "").trim();
        const m      = raw.match(/\{[\s\S]*\}/);
        if (m) {
          const parsed   = JSON.parse(m[0]);
          score          = Math.round(Math.max(1, Math.min(10, parsed.score ?? 6)));
          feedback       = parsed.feedback    ?? feedback;
          isCorrect      = parsed.isCorrect   ?? (score >= 8 ? "correct" : score >= 5 ? "partial" : "incorrect");
          modelAnswer    = parsed.modelAnswer ?? modelAnswer;
          // Normalise isCorrect
          if (!["correct", "partial", "incorrect"].includes(isCorrect)) {
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

    /* ── Scoring rule: incorrect answers (1–4) score 0 marks ── */
    const awardedScore = isCorrect === "incorrect" ? 0 : score;

    /* ── Persist ── */
    const fullFeedback = JSON.stringify({ feedback, isCorrect, modelAnswer });

    await db.question.update({
      where: { id: questionId },
      data: {
        userAnswer: answer,
        score:      awardedScore,
        feedback:   fullFeedback,
        isSkipped:  false,
      },
    });

    return NextResponse.json({ ok: true, score: awardedScore, rawScore: score, feedback, isCorrect, modelAnswer });
  } catch (err: any) {
    console.error("[ANSWER_ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
