import type { ViewerLike } from "./userAccess";

const EXPENSE_MANAGER_ROLES = new Set(["finance", "hr"]);

/** README: finance manages expenses; HR commonly needs access too */
export function assertCanManageExpenses(viewer: ViewerLike & { id: number }): void {
  if (!EXPENSE_MANAGER_ROLES.has(String(viewer.role))) {
    throw new Error("Not authorized to manage expenses.");
  }
}
