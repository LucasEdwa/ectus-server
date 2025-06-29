import { db } from "./db";

// Create expenses table if not exists
export const createExpensesTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      description VARCHAR(255) NOT NULL,
      amount FLOAT NOT NULL,
      date DATE NOT NULL
    )
  `);
};

export const createExpense = async (
  description: string,
  amount: number,
  date: string
) => {
  await db.query(
    "INSERT INTO expenses (description, amount, date) VALUES (?, ?, ?)",
    [description, amount, date]
  );
};

export const getAllExpenses = async () => {
  const [rows]: any = await db.query(
    "SELECT * FROM expenses ORDER BY date DESC"
  );
  return rows;
};

export const initExpenseModel = async () => {
  await createExpensesTable();
};
