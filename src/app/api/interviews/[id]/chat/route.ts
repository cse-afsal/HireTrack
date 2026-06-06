import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { answer } = await req.json();
    if (!answer) {
      return new NextResponse("Missing answer", { status: 400 });
    }

    const interview = await db.interview.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        questions: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get the latest question the user should be answering
        },
      },
    });

    if (!interview || interview.questions.length === 0) {
      return new NextResponse("Not Found or No Active Question", { status: 404 });
    }

    const currentQuestion = interview.questions[0];

    if (currentQuestion.userAnswer) {
      // If it already has an answer, we shouldn't be here unless something went wrong with client sync
      return new NextResponse("Question already answered", { status: 400 });
    }

    // Generate the next Question prompt and feedback using Gemini
    let score = Math.floor(Math.random() * 5) + 6;
    let feedback = "Good approach, but could be optimized further.";
    let nextPrompt = "Can you elaborate on your solution?";

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const allQuestions = await db.question.findMany({
        where: { interviewId: interview.id },
        orderBy: { createdAt: 'asc' }
      });
      
      const isFinalQuestion = allQuestions.length >= 10;

      let conversationHistory = `You are an expert technical interviewer conducting a ${interview.difficulty} level ${interview.domain.toUpperCase().replace('_', ' ')} interview.\n`;
      if (isFinalQuestion) {
        conversationHistory += `This is the FINAL part of the interview. Evaluate the candidate's latest answer, provide internal feedback, a score from 1-10, and provide a polite closing statement to end the interview as the 'nextQuestion'. Do NOT ask any more questions.\n`;
      } else {
        conversationHistory += `Evaluate the candidate's latest answer, provide internal feedback, a score from 1-10, and the NEXT question you want to ask.\n`;
      }
      conversationHistory += "Format your output strictly as a JSON object with properties 'score' (number), 'feedback' (string), and 'nextQuestion' (string).\n\n";
      
      for (const q of allQuestions) {
        conversationHistory += `Interviewer: ${q.prompt}\n`;
        if (q.id === currentQuestion.id) {
           conversationHistory += `Candidate: ${answer}\n`;
        } else if (q.userAnswer) {
           conversationHistory += `Candidate: ${q.userAnswer}\n`;
        }
      }
      
      const result = await model.generateContent(conversationHistory);
      const responseText = result.response.text();
      
      let parsed;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
      } catch (e) {
        parsed = {
           score: 7,
           feedback: "I received your answer.",
           nextQuestion: responseText.replace(/`/g, "").replace("json", "").trim()
        };
      }
      
      score = parsed.score || 7;
      feedback = parsed.feedback || "Thank you.";
      nextPrompt = parsed.nextQuestion || "Can you elaborate?";
      
    } catch (aiError) {
      console.warn("Gemini generation failed for chat", aiError);
      const mockPrompts = [
        "That makes sense. Can you walk me through the time and space complexity of your solution?",
        "Interesting perspective. What edge cases did you consider?",
        "How would your design change if we had 10x the traffic?",
      ];
      nextPrompt = mockPrompts[Math.floor(Math.random() * mockPrompts.length)];
    }

    // Update the current question with the user's answer
    await db.question.update({
      where: { id: currentQuestion.id },
      data: {
        userAnswer: answer,
        score, 
        feedback,
      },
    });

    const nextQuestion = await db.question.create({
      data: {
        interviewId: interview.id,
        prompt: nextPrompt,
      },
    });

    if (isFinalQuestion) {
      await db.interview.update({
        where: { id: interview.id },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json({
       previousQuestionId: currentQuestion.id,
       nextQuestion,
       isComplete: isFinalQuestion
    });

  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
