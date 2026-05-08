import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchBodySchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  content: z.string().trim().min(2).max(2000).optional(),
  category: z.string().trim().min(1).max(60).optional(),
});

interface RouteParams {
  params: { id: string };
}

/**
 * PATCH /api/quotes/:id
 * Edit a generated quote (title / content / category).
 * Tenant-scoped: only the owner can edit their own quotes.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();
    const body = patchBodySchema.parse(await req.json());

    const quote = await prisma.generatedQuote.findFirst({
      where: {
        id: params.id,
        tenantId: ctx.tenant.id,
        userId: ctx.user.id,
      },
    });
    if (!quote) return jsonError("הציטוט לא נמצא", 404);

    const updated = await prisma.generatedQuote.update({
      where: { id: quote.id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
      },
    });

    return jsonOk({
      id: updated.id,
      title: updated.title,
      content: updated.content,
      category: updated.category,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * DELETE /api/quotes/:id
 * Permanently remove a generated quote. Cascades to its SavedQuote
 * (if any) thanks to onDelete: Cascade in the Prisma schema.
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();

    const quote = await prisma.generatedQuote.findFirst({
      where: {
        id: params.id,
        tenantId: ctx.tenant.id,
        userId: ctx.user.id,
      },
    });
    if (!quote) return jsonError("הציטוט לא נמצא", 404);

    await prisma.generatedQuote.delete({ where: { id: quote.id } });
    return jsonOk({ id: quote.id });
  } catch (err) {
    return handleApiError(err);
  }
}
