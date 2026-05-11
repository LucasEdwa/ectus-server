import { RowDataPacket } from "mysql2";
import { db } from "../models/db";

/** Thin repository seam — mock this module in tests instead of reaching mysql2 directly */
export async function findCompanyById(id: number): Promise<(RowDataPacket & Record<string, unknown>) | null> {
  const [rows]: any = await db.query("SELECT * FROM companies WHERE id = ?", [id]);
  return rows[0] ?? null;
}
