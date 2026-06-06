import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("Constructing...");
try {
  const genAI = new GoogleGenerativeAI("dummy_key");
  console.log("Constructed ok.");
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  console.log("Got model.");
} catch (err) {
  console.error("Failed to init:", err);
}
