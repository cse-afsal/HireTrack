import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Accepted file types
const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "application/pdf",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text?.trim() ?? "";
  } catch (e) {
    console.warn("pdf-parse failed:", e);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Check extension
    const lowerName = file.name.toLowerCase();
    const isAccepted = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!isAccepted) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, JPG, or PNG resume." },
        { status: 400 }
      );
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "File is too large. Max size is 15 MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // Determine mime type
    const rawMime = file.type || "";
    const mimeType: string =
      ACCEPTED_TYPES[rawMime] ||
      (lowerName.endsWith(".pdf")
        ? "application/pdf"
        : lowerName.endsWith(".png")
        ? "image/png"
        : "image/jpeg");

    const PROMPT = `You are an expert ATS recruiter and resume coach.
Analyse the resume in this document/image and respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "score": <integer 0-100>,
  "jobTitle": "<best-fit job title for this candidate>",
  "feedback": "<detailed 4-5 paragraph feedback: strengths, ATS gaps, content weaknesses, specific improvements, overall verdict>"
}
Scoring guide: 80-100 excellent, 60-79 good, 40-59 average, 0-39 poor.`;

    let analysisText = "";

    // ── Strategy 1: Send file directly to Gemini as multimodal input (works for PDF, images) ──
    try {
      // Use gemini-2.0-flash which has strong vision + PDF support
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent([
        { inlineData: { mimeType: mimeType as any, data: base64Data } },
        PROMPT,
      ]);
      analysisText = result.response.text();
    } catch (geminiErr: any) {
      console.warn("Gemini 2.0 flash multimodal failed, trying gemini-1.5-flash:", geminiErr?.message);

      // ── Strategy 2: Retry with gemini-1.5-flash ──
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([
          { inlineData: { mimeType: mimeType as any, data: base64Data } },
          PROMPT,
        ]);
        analysisText = result.response.text();
      } catch (err2: any) {
        console.warn("Gemini 1.5 flash multimodal failed:", err2?.message);
      }
    }

    // ── Strategy 3 (PDF only): Extract text and send as text prompt ──
    if (!analysisText && mimeType === "application/pdf") {
      try {
        const textContent = await extractTextFromPDF(buffer);
        if (textContent && textContent.length > 50) {
          const trimmed = textContent.slice(0, 12000);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent(
            `${PROMPT}\n\nResume text:\n"""\n${trimmed}\n"""`
          );
          analysisText = result.response.text();
        }
      } catch (textErr: any) {
        console.warn("Text extraction fallback failed:", textErr?.message);
      }
    }

    if (!analysisText) {
      return NextResponse.json(
        {
          error:
            "Unable to read the resume. Please ensure it is a clear, text-based PDF or a good quality image (JPG/PNG) and try again.",
        },
        { status: 422 }
      );
    }

    // ── Parse JSON ──
    const cleaned = analysisText
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON.");

    const analysis = JSON.parse(jsonMatch[0]);
    if (typeof analysis.score !== "number" || !analysis.jobTitle || !analysis.feedback) {
      throw new Error("Incomplete AI response.");
    }
    analysis.score = Math.max(0, Math.min(100, Math.round(analysis.score)));

    // ── Persist ──
    const resume = await db.resume.create({
      data: {
        userId: session.user.id,
        title: file.name.replace(/\.(pdf|jpg|jpeg|png|webp)$/i, ""),
        content: `Analyzed file: ${file.name}`,
        score: analysis.score,
        jobTitle: analysis.jobTitle,
        feedback: analysis.feedback,
      },
    });

    return NextResponse.json(resume);
  } catch (err: any) {
    console.error("Resume Analysis Error:", err?.message ?? err);
    const msg = err?.message?.includes("JSON")
      ? "AI returned an unexpected format. Please re-upload and try again."
      : "Analysis failed. Please try with a different file or try again.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
