import { db } from "./db";

export const createExpensesTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      company_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED,
      category_id INT UNSIGNED,
      description VARCHAR(255) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      expense_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

export const initExpenseModel = async () => {
  await createExpensesTable();
};

export const dropExpensesTable = async () => {
  await db.query("SET FOREIGN_KEY_CHECKS = 0");
  await db.query("DROP TABLE IF EXISTS expenses");
  await db.query("SET FOREIGN_KEY_CHECKS = 1");
};

export const removeCategoryColumnIfExists = async () => {
  // Check if the 'category' column exists
  const [rows]: any = await db.query(`
    SHOW COLUMNS FROM expenses LIKE 'category'
  `);
  if (rows.length > 0) {
    await db.query(`ALTER TABLE expenses DROP COLUMN category`);
  }
};
