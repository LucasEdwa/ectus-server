import { db } from "./db";

export const createExpenseCategoriesTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS expense_categories (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      company_id INT UNSIGNED NOT NULL,
      name VARCHAR(64) NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const initExpenseCategoryModel = async () => {
  await createExpenseCategoriesTable();
};
