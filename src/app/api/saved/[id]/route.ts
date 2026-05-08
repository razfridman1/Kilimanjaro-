import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchBodySchema = z.object({
  customCategory: z.string().trim().max(60).optional().nullable(),
  isFavorite: z.boolean().optional(),
  note: z.string().trim().max(2000).optional().nullable(),
});

interface RouteParams {
  params: { id: string };
}

/**
 * PATCH /api/saved/:id
 * Update a saved quote (custom category, favorite flag, note).
 * The :id param can be either the SavedQuote id or the underlying
 * GeneratedQuote id — we resolve both for convenience.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();
    const body = patchBodySchema.parse(await req.json());

    const saved = await prisma.savedQuote.findFirst({
      where: {
        OR: [{ id: params.id }, { quoteId: params.id }],
        tenantId: ctx.tenant.id,
        userId: ctx.user.id,
      },
    });
    if (!saved) return jsonError("הפריט לא נמצא", 404);

    const updated = await prisma.savedQuote.update({
      where: { id: saved.id },
      data: {
        ...(body.customCategory !== undefined
          ? { customCategory: body.customCategory }
          : {}),
        ...(body.isFavorite !== undefined
          ? { isFavorite: body.isFavorite }
          : {}),
        ...(body.note !== undefined ? { note: body.note } : {}),
      },
    });

    return jsonOk({
      id: updated.id,
      customCategory: updated.customCategory,
      isFavorite: updated.isFavorite,
      note: updated.note,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * DELETE /api/saved/:id
 * Remove a saved quote from the user's collection. The underlying
 * GeneratedQuote row is preserved (so the user can re-save later).
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();

    const saved = await prisma.savedQuote.findFirst({
      where: {
        OR: [{ id: params.id }, { quoteId: params.id }],
        tenantId: ctx.tenant.id,
        userId: ctx.user.id,
      },
    });
    if (!saved) return jsonError("הפריט לא נמצא", 404);

    await prisma.savedQuote.delete({ where: { id: saved.id } });
    return jsonOk({ id: saved.id });
  } catch (err) {
    return handleApiError(err);
  }
}
