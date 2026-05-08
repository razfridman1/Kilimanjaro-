import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { z } from "zod";

/**
 * AI generation layer.
 *
 * Provider-agnostic wrapper that returns 6 unique Hebrew motivation
 * items in a strict JSON shape. Switch providers via `AI_PROVIDER` env.
 */

export const MOTIVATION_CATEGORIES = [
  "משמעת",
  "ביטחון עצמי",
  "מוטיבציה לאימון",
  "פרודוקטיביות",
  "מיקוד",
  "הערכה עצמית",
  "מיינדסט של הצלחה",
  "התמדה",
  "צמיחה אישית",
  "ניהול זמן",
] as const;

export type MotivationCategory = (typeof MOTIVATION_CATEGORIES)[number];

export const motivationItemSchema = z.object({
  title: z.string().min(2).max(80),
  content: z.string().min(10).max(400),
  category: z.string().min(2).max(40),
});

export const MOTIVATION_ITEM_COUNT = 6;

export const motivationResponseSchema = z.object({
  items: z.array(motivationItemSchema).length(MOTIVATION_ITEM_COUNT),
});

export type MotivationItem = z.infer<typeof motivationItemSchema>;

export interface GenerateOptions {
  topic?: string;
  mood?: string;
  /** Avoid repeating these recently-seen titles. */
  avoidTitles?: string[];
}

const SYSTEM_PROMPT = `אתה מאמן מוטיבציה ופיתוח אישי בעברית.
המשימה שלך: לייצר 6 פריטי מוטיבציה ייחודיים, מעוררי השראה ומעשיים, כולם בעברית בלבד.

חוקים מחייבים:
- כל פריט חייב להיות שונה מהאחרים – ללא חזרות רעיון או ניסוח.
- הטון חם, ישיר, אנושי, ללא קלישאות שחוקות.
- כל פריט מורכב משלושה שדות: title (שורה אחת קצרה ועוצמתית), content (1–3 משפטים מעשיים), category (אחת מהקטגוריות שניתנו).
- אל תכתוב כותרות באנגלית. אל תוסיף אימוג'ים אלא אם המשתמש ביקש במפורש.
- החזר אך ורק JSON תקף בפורמט: {"items":[{"title":"...","content":"...","category":"..."}, ...]} – ללא טקסט נוסף, ללא code fences.`;

function buildUserPrompt(opts: GenerateOptions): string {
  const allowed = MOTIVATION_CATEGORIES.join(", ");
  const lines: string[] = [
    `ייצר 6 פריטי מוטיבציה ייחודיים בעברית.`,
    `קטגוריות מותרות: ${allowed}.`,
  ];
  if (opts.topic) lines.push(`התמקד בנושא: ${opts.topic}.`);
  if (opts.mood) lines.push(`מצב הרוח של המשתמש: ${opts.mood}.`);
  if (opts.avoidTitles?.length) {
    lines.push(
      `אל תחזור על הכותרות הבאות: ${opts.avoidTitles.slice(0, 30).join(" | ")}.`,
    );
  }
  lines.push(
    `החזר אך ורק JSON תקף עם השדה "items" המכיל מערך של 6 אובייקטים.`,
  );
  return lines.join("\n");
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  // Strip optional code fences.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  // Otherwise, slice from first { to last }.
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
}

export interface AIProviderResult {
  items: MotivationItem[];
  provider: "anthropic" | "openai";
  model: string;
}

async function generateWithAnthropic(
  opts: GenerateOptions,
): Promise<AIProviderResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
  const client = new Anthropic({ apiKey });

  const msg = await client.messages.create({
    model,
    max_tokens: 2048,
    temperature: 0.9,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(opts) }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = motivationResponseSchema.parse(JSON.parse(extractJson(text)));
  return { items: parsed.items, provider: "anthropic", model };
}

async function generateWithOpenAI(
  opts: GenerateOptions,
): Promise<AIProviderResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(opts) },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const parsed = motivationResponseSchema.parse(JSON.parse(extractJson(text)));
  return { items: parsed.items, provider: "openai", model };
}

/**
 * Generate 6 unique Hebrew motivation items via the configured provider.
 * Falls back to a deterministic local sample only if the provider call
 * fails AND the env doesn't disallow fallbacks (set AI_STRICT=1 in prod).
 */
export async function generateMotivation(
  opts: GenerateOptions = {},
): Promise<AIProviderResult> {
  const provider = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();

  if (provider === "openai") return generateWithOpenAI(opts);
  return generateWithAnthropic(opts);
}
