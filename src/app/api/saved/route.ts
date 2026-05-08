import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Save an existing AI-generated quote (by id).
const saveGeneratedSchema = z.object({
  quoteId: z.string().min(1),
  customCategory: z.string().trim().max(60).optional().nullable(),
  isFavorite: z.boolean().optional(),
});

// Save a manually-typed quote — creates a GeneratedQuote on-the-fly
// (with no generationId) and saves it in one go.
const saveManualSchema = z.object({
  manual: z.literal(true),
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(2).max(2000),
  category: z.string().trim().min(1).max(60).optional(),
  isFavorite: z.boolean().optional(),
});

const listQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  sort: z.enum(["newest", "oldest", "favorite"]).optional(),
  cursor: z.string().optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * GET /api/saved
 * List the current user's saved quotes (within their tenant) with
 * optional search, category filter, sort, and cursor pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const url = new URL(req.url);
    const params = listQuerySchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    );

    const orderBy =
      params.sort === "oldest"
        ? { createdAt: "asc" as const }
        : params.sort === "favorite"
          ? [{ isFavorite: "desc" as const }, { createdAt: "desc" as const }]
          : { createdAt: "desc" as const };

    const where = {
      tenantId: ctx.tenant.id,
      userId: ctx.user.id,
      ...(params.category
        ? {
            OR: [
              { customCategory: params.category },
              { quote: { category: params.category } },
            ],
          }
        : {}),
      ...(params.search
        ? {
            quote: {
              OR: [
                { title: { contains: params.search, mode: "insensitive" as const } },
                { content: { contains: params.search, mode: "insensitive" as const } },
              ],
            },
          }
        : {}),
    };

    const take = params.take ?? 30;
    const items = await prisma.savedQuote.findMany({
      where,
      orderBy,
      take: take + 1,
      ...(params.cursor
        ? { cursor: { id: params.cursor }, skip: 1 }
        : {}),
      include: {
        quote: true,
        category: true,
      },
    });

    const hasMore = items.length > take;
    const sliced = hasMore ? items.slice(0, take) : items;

    return jsonOk({
      items: sliced.map((s) => ({
        id: s.id,
        savedId: s.id,
        quoteId: s.quoteId,
        title: s.quote.title,
        content: s.quote.content,
        category: s.customCategory ?? s.quote.category,
        originalCategory: s.quote.category,
        customCategory: s.customCategory,
        isFavorite: s.isFavorite,
        note: s.note,
        createdAt: s.createdAt,
        saved: true,
      })),
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/saved
 * Two modes:
 *   1. { quoteId, ... }                         → save an existing AI quote
 *   2. { manual: true, title, content, ... }    → save a manually-typed quote
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const raw = await req.json();

    if (raw?.manual === true) {
      const body = saveManualSchema.parse(raw);

      const result = await prisma.$transaction(async (tx) => {
        const quote = await tx.generatedQuote.create({
          data: {
            tenantId: ctx.tenant.id,
            userId: ctx.user.id,
            title: body.title,
            content: body.content,
            category: body.category ?? "אישי",
            language: "he",
          },
        });
        const saved = await tx.savedQuote.create({
          data: {
            tenantId: ctx.tenant.id,
            userId: ctx.user.id,
            quoteId: quote.id,
            isFavorite: body.isFavorite ?? false,
          },
        });
        return { quote, saved };
      });

      return jsonOk({
        id: result.saved.id,
        savedId: result.saved.id,
        quoteId: result.quote.id,
        title: result.quote.title,
        content: result.quote.content,
        category: result.quote.category,
      });
    }

    const body = saveGeneratedSchema.parse(raw);

    // Verify the quote belongs to this user/tenant before saving.
    const quote = await prisma.generatedQuote.findFirst({
      where: {
        id: body.quoteId,
        tenantId: ctx.tenant.id,
        userId: ctx.user.id,
      },
    });
    if (!quote) {
      return jsonError("הציטוט לא נמצא", 404);
    }

    const saved = await prisma.savedQuote.upsert({
      where: { userId_quoteId: { userId: ctx.user.id, quoteId: quote.id } },
      update: {
        customCategory: body.customCategory ?? null,
        isFavorite: body.isFavorite ?? false,
      },
      create: {
        tenantId: ctx.tenant.id,
        userId: ctx.user.id,
        quoteId: quote.id,
        customCategory: body.customCategory ?? null,
        isFavorite: body.isFavorite ?? false,
      },
    });

    return jsonOk({ id: saved.id, savedId: saved.id });
  } catch (err) {
    return handleApiError(err);
  }
}
