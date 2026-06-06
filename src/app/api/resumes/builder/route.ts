import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  console.log("POST /api/resumes/builder hit");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const title = `${data.name || "My"} Builder Resume`;
    const builderData = JSON.stringify(data);
    const contentText = `${data.name}\n${data.title}\n${data.summary}\n${data.education}\n${data.projects}\n${data.achievements}\n${data.certifications}\n${data.languages}`;

    // Create a generic resume record
    const resume = await db.resume.create({
      data: {
        userId: session.user.id,
        title,
        jobTitle: data.title,
        content: contentText, // Save a text version so it can be used for mock interviews
        builderData: builderData
      }
    });

    return NextResponse.json(resume);
  } catch (error) {
    console.error("Resume Builder Error:", error);
    return NextResponse.json(
      { error: "Failed to save builder resume" },
      { status: 500 }
    );
  }
}
