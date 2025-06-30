import { db } from "./db";

export const createBillsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS bills (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      expense_id INT UNSIGNED NOT NULL,
      bill_number VARCHAR(64) NOT NULL,
      bill_date DATE NOT NULL,
      due_date DATE,
      supplier VARCHAR(128),
      amount DECIMAL(12,2) NOT NULL,
      vat DECIMAL(12,2),
      file_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const initBillModel = async () => {
  await createBillsTable();
};
