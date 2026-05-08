import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  cursor: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * GET /api/quotes
 * List all generated quotes for the current user (paginated, newest first).
 * Each item includes its saved-state so the UI can show "saved" / "favorite"
 * badges in history view.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const url = new URL(req.url);
    const params = querySchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    );

    const take = params.take ?? 30;

    const items = await prisma.generatedQuote.findMany({
      where: { tenantId: ctx.tenant.id, userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(params.cursor
        ? { cursor: { id: params.cursor }, skip: 1 }
        : {}),
      include: {
        saved: { select: { id: true, isFavorite: true } },
      },
    });

    const hasMore = items.length > take;
    const sliced = hasMore ? items.slice(0, take) : items;

    return jsonOk({
      items: sliced.map((q) => ({
        id: q.id,
        title: q.title,
        content: q.content,
        category: q.category,
        createdAt: q.createdAt,
        saved: q.saved.length > 0,
        savedId: q.saved[0]?.id ?? null,
        isFavorite: q.saved[0]?.isFavorite ?? false,
      })),
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
