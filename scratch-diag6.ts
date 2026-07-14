import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { GoogleGenAI } from "@google/genai";
import { requirementsResponseSchema } from "./lib/requirements-schema";

const SYSTEM_PROMPT_STUB = "SEE lib/gemini.ts"; // not used directly; we import the real client call pattern below

const history = [
  { role: "user", content: "I want a static e-commerce website for school supplies. Students and parents browse a catalog with photos and prices, add to cart, and checkout via a contact form that emails me the order (bank transfer payment, no online payment integration). No user accounts, no admin dashboard, I update the catalog manually. Web app." },
  { role: "assistant", content: "That sounds like a clear vision for your e-commerce site for school supplies! I understand it's a web app for students and parents to browse a catalog, add items to a cart, and submit an order via a contact form that emails you the details for bank transfer payment, with no online payment, user accounts, or admin dashboard. You'll update the catalog manually.\n\nDo you have any specific design preferences for how the website should look or feel, perhaps some examples of websites you like?" },
  { role: "user", content: "Clean, bright, and colorful, friendly for parents and kids. No specific timeline, nothing else to add." },
  { role: "assistant", content: "Thanks for sharing your design preferences! It sounds like a clean, bright, and colorful site, friendly for both parents and kids. I've noted that there's no specific timeline and no other requirements at this time." },
  { role: "user", content: "No specific timeline needed." },
  { role: "assistant", content: "Got it, no specific timeline is needed for the project. It sounds like we have a good understanding of your vision for the e-commerce site.\n\nNo further questions at this time." },
  { role: "user", content: "No timeline needed, skip that." },
  { role: "assistant", content: "Thanks for clarifying again that no specific timeline is needed for this project.\n\nGreat, I think I have a solid understanding of your project! Before I put together your full summary and cost estimate, could you share your full name, email address, and your estimated budget?" },
  { role: "user", content: "My name is Cilla Adlawan, my email is cillaadlawan@gmail.com, my address is Taguig, and my estimated budget is around ₱1,000 to ₱2,000." },
];

// Reproduce lib/gemini.ts's SYSTEM_PROMPT by importing the module source is awkward since it's not exported;
// instead, monkeypatch: temporarily require the compiled prompt via a hack — simplest: just call generateContent
// the same way getNextTurn does, but skip assertSaneTurn, by inlining the same request.
import fs from "fs";
const geminiSrc = fs.readFileSync("./lib/gemini.ts", "utf-8");
const match = geminiSrc.match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/);
if (!match) throw new Error("couldn't extract system prompt");
const SYSTEM_PROMPT = match[1];

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const contents = history.map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }));

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL!,
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: requirementsResponseSchema,
      maxOutputTokens: 2048,
    },
  });

  const text = response.text;
  console.log("RAW TEXT LENGTH:", text?.length);
  console.log(text);
}

main().catch((e) => console.error("API ERROR", e));
