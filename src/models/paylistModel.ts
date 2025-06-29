import { db } from "./db";

// Create paylists table if not exists
export const createPaylistsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS paylists (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      employee_id INT UNSIGNED NOT NULL,
      month DATE NOT NULL,
      pdf_url VARCHAR(255) NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const createPaylist = async (
  employee_id: number,
  month: string,
  pdf_url: string
) => {
  await db.query(
    "INSERT INTO paylists (employee_id, month, pdf_url) VALUES (?, ?, ?)",
    [employee_id, month, pdf_url]
  );
};

export const getPaylistsByEmployee = async (employee_id: number) => {
  const [rows]: any = await db.query(
    "SELECT * FROM paylists WHERE employee_id = ? ORDER BY month DESC",
    [employee_id]
  );
  return rows;
};

export const initPaylistModel = async () => {
  await createPaylistsTable();
};
