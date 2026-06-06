import { GoogleGenerativeAI } from "@google/generative-ai";

async function run() {
  console.log("Testing generation...");
  try {
    const genAI = new GoogleGenerativeAI("dummy_key");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent("Hello!");
    console.log(result.response.text());
  } catch (err) {
    console.error("Failed to generate:", err);
  }
}
run();
