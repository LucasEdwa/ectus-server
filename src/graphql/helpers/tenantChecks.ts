import { db } from "../../models/db";
import {
  isWorkforcePrivilegedRole,
  resolveViewerCompanyId,
  type ViewerLike,
} from "../auth/userAccess";

export async function getUserCompanyId(userId: number): Promise<number | null> {
  const [rows]: any = await db.query("SELECT company_id FROM users WHERE id = ?", [userId]);
  if (!rows?.length) return null;
  const cid = rows[0].company_id;
  if (cid === null || cid === undefined) return null;
  return Number(cid);
}

export async function assertEmployeeInCompany(employeeId: number, companyId: number): Promise<void> {
  const cid = await getUserCompanyId(employeeId);
  if (cid === null || Number(cid) !== Number(companyId)) {
    throw new Error("Employee not found or not in your company.");
  }
}

export async function assertClientInCompany(clientId: number | null | undefined, companyId: number): Promise<void> {
  if (clientId === null || clientId === undefined) return;
  const [rows]: any = await db.query("SELECT company_id FROM clients WHERE id = ?", [clientId]);
  if (!rows?.length || Number(rows[0].company_id) !== Number(companyId)) {
    throw new Error("Client not found or not in your company.");
  }
}

export async function getShiftEmployeeCompanyId(shiftId: number): Promise<number | null> {
  const [rows]: any = await db.query(
    `SELECT u.company_id FROM shifts s JOIN users u ON u.id = s.employee_id WHERE s.id = ?`,
    [shiftId]
  );
  if (!rows?.length) return null;
  const cid = rows[0].company_id;
  return cid === null || cid === undefined ? null : Number(cid);
}

export async function getExpenseCompanyId(expenseId: number): Promise<number | null> {
  const [rows]: any = await db.query("SELECT company_id FROM expenses WHERE id = ?", [expenseId]);
  if (!rows?.length) return null;
  return Number(rows[0].company_id);
}

export async function getExpenseCategoryCompanyId(categoryId: number): Promise<number | null> {
  const [rows]: any = await db.query("SELECT company_id FROM expense_categories WHERE id = ?", [categoryId]);
  if (!rows?.length) return null;
  return Number(rows[0].company_id);
}

export async function getClientCompanyId(clientId: number): Promise<number | null> {
  const [rows]: any = await db.query("SELECT company_id FROM clients WHERE id = ?", [clientId]);
  if (!rows?.length) return null;
  return Number(rows[0].company_id);
}

export async function getDocumentRowCompany(id: number): Promise<number | null> {
  const [rows]: any = await db.query("SELECT company_id FROM documents WHERE id = ?", [id]);
  if (!rows?.length) return null;
  return Number(rows[0].company_id);
}

export async function assertViewerMayAccessPaylist(
  viewer: ViewerLike & { id: number },
  paylist: { company_id: number; employee_id: number }
): Promise<void> {
  const vc = await resolveViewerCompanyId(viewer);
  if (Number(paylist.company_id) !== vc) {
    throw new Error("Not authorized to access this paylist.");
  }
  if (isWorkforcePrivilegedRole(viewer.role)) return;
  if (Number(paylist.employee_id) !== Number(viewer.id)) {
    throw new Error("Not authorized to access this paylist.");
  }
}

export async function assertViewerMayAccessDocumentRow(
  viewer: ViewerLike & { id: number },
  doc: { company_id: number; employee_id: number }
): Promise<void> {
  const vc = await resolveViewerCompanyId(viewer);
  if (Number(doc.company_id) !== vc) {
    throw new Error("Not authorized to access this document.");
  }
  if (isWorkforcePrivilegedRole(viewer.role)) return;
  if (Number(doc.employee_id) !== Number(viewer.id)) {
    throw new Error("Not authorized to access this document.");
  }
}
