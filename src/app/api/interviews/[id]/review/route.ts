import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * GET /api/interviews/[id]/review
 * Returns (or generates) the final AI review for a completed interview.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const interview = await db.interview.findUnique({
      where: { id: params.id, userId: session.user.id },
      include: { questions: { orderBy: { createdAt: "asc" } } },
    });
    if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // If review already saved, return it
    if (interview.feedback) {
      return NextResponse.json({
        score: interview.score,
        feedback: interview.feedback,
        questions: interview.questions,
      });
    }

    // Build transcript
    const transcript = interview.questions.map((q, i) =>
      `Q${i+1}: ${q.prompt}\nA: ${q.userAnswer || "(no answer)"}\nScore: ${q.score ?? "?"}/10`
    ).join("\n\n");

    const avgScore = interview.questions.reduce((s, q) => s + (q.score ?? 5), 0) / (interview.questions.length || 1);
    const overallScore = Math.round(avgScore * 10);

    let reviewData = {
      overallScore,
      summary: "The interview has been completed.",
      strengths: [] as string[],
      improvements: [] as string[],
      topics: [] as string[],
      verdict: "Good",
    };

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(
        `You are a senior interviewer writing a post-interview performance review.

Interview domain: ${interview.domain}
Difficulty: ${interview.difficulty}
Transcript:
${transcript}

Return ONLY valid JSON (no markdown):
{
  "overallScore": <0-100 integer>,
  "summary": "<3-4 sentence overall assessment>",
  "strengths": ["<point>", "<point>", "<point>"],
  "improvements": ["<point>", "<point>", "<point>"],
  "topics": ["<topic to study>", "<topic>", "<topic>"],
  "verdict": "<one of: Excellent | Good | Average | Needs Work>"
}`
      );
      const raw = result.response.text().replace(/```json\s*/gi, "").replace(/```/g, "").trim();
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        reviewData = {
          overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore ?? overallScore))),
          summary: parsed.summary ?? reviewData.summary,
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : [],
          topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 6) : [],
          verdict: parsed.verdict ?? reviewData.verdict,
        };
      }
    } catch (e) {
      console.warn("Review generation failed", e);
    }

    // Save review to interview
    await db.interview.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        score: reviewData.overallScore,
        feedback: JSON.stringify(reviewData),
      },
    });

    return NextResponse.json({
      score: reviewData.overallScore,
      feedback: JSON.stringify(reviewData),
      questions: interview.questions,
    });
  } catch (err: any) {
    console.error("[REVIEW_ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
