import { db } from "../../models/db";

export type ViewerLike = {
  id?: number;
  role?: string;
  company_id?: number | null;
};

const WORKFORCE_PRIVILEGED_ROLES = new Set(["finance", "leader", "hr"]);

/** Finance / leader / HR — broader workforce data (paylists, time balances, secured files, etc.) */
export function isWorkforcePrivilegedRole(role: string | undefined): boolean {
  return WORKFORCE_PRIVILEGED_ROLES.has(String(role));
}

export function assertAuthenticated(viewer: ViewerLike | undefined): asserts viewer is ViewerLike & { id: number } {
  if (!viewer?.id) {
    throw new Error("Not authenticated");
  }
}

export function canViewOtherUsersInCompany(viewer: ViewerLike & { id: number }): boolean {
  return WORKFORCE_PRIVILEGED_ROLES.has(String(viewer.role));
}

/** Resolve company_id from JWT or DB when claims omit it */
export async function resolveViewerCompanyId(viewer: ViewerLike & { id: number }): Promise<number> {
  let cid = viewer.company_id;
  if (cid !== undefined && cid !== null && !Number.isNaN(Number(cid))) {
    return Number(cid);
  }
  const [rows]: any = await db.query("SELECT company_id FROM users WHERE id = ?", [viewer.id]);
  const fromDb = rows[0]?.company_id;
  if (fromDb === undefined || fromDb === null || Number.isNaN(Number(fromDb))) {
    throw new Error("Not authorized: user has no company assignment.");
  }
  return Number(fromDb);
}
