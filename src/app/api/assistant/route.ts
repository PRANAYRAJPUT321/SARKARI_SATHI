import Anthropic from "@anthropic-ai/sdk";
import { getVercelOidcToken } from "@vercel/oidc";
import { NextResponse } from "next/server";
import { knowledgeText, searchHelp } from "@/lib/assistant-kb";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Claude via Vercel AI Gateway (authenticated with the deployment's OIDC token).
const MODELS = ["anthropic/claude-opus-5.5", "anthropic/claude-opus-5-5"];

const SYSTEM = `You are "Sathi", the in-app help assistant of Sarkari Sathi – a government exam preparation web app built by Pranay.

Scope: answer ONLY questions about using Sarkari Sathi (features, navigation, settings, install, notifications, tests, reports, planner, syllabus, cut-offs and exam information that appears in the knowledge below). For anything else – general knowledge, solving exam questions, current affairs, other apps, personal advice – reply in one sentence that you can only help with Sarkari Sathi, and suggest the relevant app feature (e.g. Practice or Flashcards) if useful.

Accuracy rules:
- Use only the knowledge below. Never invent features, exam dates, cut-offs, vacancies or patterns. If something isn't in the knowledge, say you don't have that information and point to the exam's official website.
- Exam dates: only the officially announced dates listed in the knowledge exist; for other exams say the date has not been announced yet.
- Name the exact page/button (e.g. "Study Planner → Auto-generate my study plan").

Style: friendly, concise (under 120 words), simple English. Use short bullet points or numbered steps when giving instructions. Use **bold** for button/page names.

${knowledgeText()}`;

type Msg = { role: "user" | "assistant"; content: string };

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 20;
}

function fallback(question: string) {
  const found = searchHelp(question);
  if (!found.length)
    return "I can help with anything about Sarkari Sathi – installing the app, notifications, mock tests, reports, the planner, syllabus tracker, cut-offs and exam dates. Try asking, for example, “How do I install the app?” or “How does negative marking work?”";
  return found.map((a, i) => (i === 0 ? a.answer : `\n\n**Related – ${a.title}:** ${a.answer}`)).join("");
}

async function askClaude(messages: Msg[]) {
  const apiKey = process.env.AI_GATEWAY_API_KEY || (await getVercelOidcToken().catch(() => undefined));
  if (!apiKey) return null;
  const client = new Anthropic({ apiKey, baseURL: "https://ai-gateway.vercel.sh", maxRetries: 1, timeout: 45_000 });
  for (const model of MODELS) {
    try {
      const res = await client.messages.create({
        model,
        max_tokens: 2000,
        output_config: { effort: "low" },
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        messages,
      });
      if (res.stop_reason === "refusal") return null;
      const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
      if (text) return text;
    } catch (e) {
      if (e instanceof Anthropic.NotFoundError || e instanceof Anthropic.BadRequestError) continue; // try the next model id
      console.error("[assistant] gateway error", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
      return null;
    }
  }
  return null;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const body = (await req.json().catch(() => null)) as { messages?: Msg[] } | null;
  const messages = (body?.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return NextResponse.json({ error: "Ask a question" }, { status: 400 });
  if (limited(ip)) return NextResponse.json({ reply: "You're asking very quickly – please wait a few minutes and try again. 🙏", source: "limit" });
  const ai = await askClaude(messages);
  if (ai) return NextResponse.json({ reply: ai, source: "ai" });
  return NextResponse.json({ reply: fallback(last.content), source: "help" });
}
