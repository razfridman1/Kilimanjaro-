import { NextRequest } from "next/server";
import { z } from "zod";
import { generateMotivation } from "@/lib/ai";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireTenantContext } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const generateBodySchema = z.object({
  topic: z.string().trim().max(120).optional(),
  mood: z.string().trim().max(40).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();

    const limit = await rateLimit(`generate:${ctx.tenant.id}:${ctx.user.id}`);
    if (!limit.success) {
      return jsonError(
        "חרגת ממגבלת היצירות לשעה. נסה שוב בקרוב.",
        429,
        { reset: limit.reset },
      );
    }

    const body = generateBodySchema.parse(await req.json().catch(() => ({})));

    // Avoid repeating recent titles for this user.
    const recent = await prisma.generatedQuote.findMany({
      where: { tenantId: ctx.tenant.id, userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { title: true },
    });

    const result = await generateMotivation({
      topic: body.topic,
      mood: body.mood,
      avoidTitles: recent.map((r) => r.title),
    });

    // Persist generation + items in a single transaction for tenant isolation.
    const created = await prisma.$transaction(async (tx) => {
      const generation = await tx.generation.create({
        data: {
          tenantId: ctx.tenant.id,
          userId: ctx.user.id,
          provider: result.provider,
          model: result.model,
          prompt: JSON.stringify({ topic: body.topic, mood: body.mood }),
          topic: body.topic ?? null,
          mood: body.mood ?? null,
          itemCount: result.items.length,
        },
      });

      const quotes = await Promise.all(
        result.items.map((item) =>
          tx.generatedQuote.create({
            data: {
              tenantId: ctx.tenant.id,
              userId: ctx.user.id,
              generationId: generation.id,
              title: item.title,
              content: item.content,
              category: item.category,
              language: "he",
            },
          }),
        ),
      );

      return { generation, quotes };
    });

    return jsonOk({
      generationId: created.generation.id,
      items: created.quotes.map((q) => ({
        id: q.id,
        title: q.title,
        content: q.content,
        category: q.category,
        saved: false,
      })),
      remaining: limit.remaining,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
