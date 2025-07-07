import { db } from "./db";
import { Paylist, CreatePaylistInput } from "../types/paylist";

// Create paylists table if not exists
export const createPaylistsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS paylists (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      company_id INT UNSIGNED NOT NULL,
      employee_id INT UNSIGNED NOT NULL,
      month DATE NOT NULL,
      pdf_url VARCHAR(255) NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createPaylist = async (
  company_id: number,
  employee_id: number,
  month: string,
  pdf_url: string
): Promise<Paylist> => {
  const [result]: any = await db.query(
    "INSERT INTO paylists (company_id, employee_id, month, pdf_url) VALUES (?, ?, ?, ?)",
    [company_id, employee_id, month, pdf_url]
  );
  const [rows]: any = await db.query("SELECT * FROM paylists WHERE id = ?", [
    result.insertId,
  ]);
  return rows[0];
};

export const getPaylistsByEmployee = async (
  employee_id: number
): Promise<Paylist[]> => {
  const [rows]: any = await db.query(
    "SELECT * FROM paylists WHERE employee_id = ? ORDER BY month DESC",
    [employee_id]
  );
  return rows;
};

export const initPaylistModel = async () => {
  await createPaylistsTable();
};
