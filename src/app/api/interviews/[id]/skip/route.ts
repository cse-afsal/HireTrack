import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/interviews/[id]/skip
 * Body: { questionId }
 *
 * Marks a question as skipped with score = 0.
 * Skipped questions are shown distinctly in the review page
 * and do NOT contribute any marks to the overall score.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { questionId } = await req.json();
    if (!questionId) return NextResponse.json({ error: "Missing questionId" }, { status: 400 });

    const question = await db.question.findUnique({
      where: { id: questionId },
      include: { interview: true },
    });

    if (!question || question.interview.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (question.interview.id !== params.id) {
      return NextResponse.json({ error: "Question does not belong to this interview" }, { status: 400 });
    }

    await db.question.update({
      where: { id: questionId },
      data: {
        isSkipped:  true,
        score:      0,
        userAnswer: "(skipped)",
        feedback:   JSON.stringify({
          feedback:    "This question was skipped.",
          isCorrect:   "incorrect",
          modelAnswer: question.modelAnswer ?? "",
        }),
      },
    });

    return NextResponse.json({ ok: true, score: 0, isSkipped: true });
  } catch (err: any) {
    console.error("[SKIP_ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
