import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Tenant, User } from "@prisma/client";

/**
 * Tenant resolution & user provisioning.
 *
 * Multi-tenancy strategy:
 *   - If the Clerk user is acting in an organization (orgId set on the
 *     session), that org IS the tenant.
 *   - Otherwise, every user gets a "personal" tenant whose clerkOrgId
 *     is `personal_<clerkUserId>`. This keeps the data model uniform
 *     and lets us upgrade a user to an org later without migrations.
 *
 * Every API route MUST start with `requireTenantContext()` and pass
 * the returned `tenantId` into every Prisma query.
 */

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface TenantContext {
  tenant: Tenant;
  user: User;
  clerkUserId: string;
}

/**
 * Resolve (or create) the Tenant + local User row for the current
 * Clerk session. Throws `UnauthorizedError` if no user is signed in.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  // Clerk v6 returns a Promise in some Next.js versions; awaiting works
  // either way since `await` on a non-Promise resolves immediately.
  const { userId, orgId, orgSlug } = await auth();
  if (!userId) {
    throw new UnauthorizedError();
  }

  const clerkOrgId = orgId ?? `personal_${userId}`;

  // Upsert tenant.
  let tenant = await prisma.tenant.findUnique({ where: { clerkOrgId } });
  if (!tenant) {
    const cu = await currentUser();
    const tenantName = orgId
      ? orgSlug ?? "Workspace"
      : cu?.firstName
        ? `${cu.firstName}'s Workspace`
        : "אזור אישי";
    tenant = await prisma.tenant.create({
      data: {
        clerkOrgId,
        name: tenantName,
        slug: orgSlug ?? null,
      },
    });
  }

  // Upsert user (per-tenant).
  let user = await prisma.user.findUnique({
    where: {
      clerkUserId_tenantId: { clerkUserId: userId, tenantId: tenant.id },
    },
  });
  if (!user) {
    const cu = await currentUser();
    user = await prisma.user.create({
      data: {
        clerkUserId: userId,
        tenantId: tenant.id,
        email:
          cu?.primaryEmailAddress?.emailAddress ??
          cu?.emailAddresses[0]?.emailAddress ??
          `${userId}@unknown.local`,
        firstName: cu?.firstName ?? null,
        lastName: cu?.lastName ?? null,
        imageUrl: cu?.imageUrl ?? null,
      },
    });
  }

  return { tenant, user, clerkUserId: userId };
}

/**
 * Returns the tenant context or `null` if unauthenticated. Use in
 * server components that should render a public landing page when
 * the visitor isn't signed in.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  try {
    return await requireTenantContext();
  } catch (err) {
    if (err instanceof UnauthorizedError) return null;
    throw err;
  }
}
