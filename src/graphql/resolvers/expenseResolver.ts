import { db } from "../../models/db";

export const expenseResolvers = {
  Query: {
    async expenses(_: any, { company_id }: { company_id?: number }) {
      let query = `
        SELECT e.*, c.name as category
        FROM expenses e
        LEFT JOIN expense_categories c ON e.category_id = c.id
      `;
      let params: any[] = [];
      if (company_id) {
        query += " WHERE e.company_id = ?";
        params.push(company_id);
      }
      const [rows]: any = await db.query(query, params);
      return rows;
    },
    async expense(_: any, { id }: { id: number }) {
      const [rows]: any = await db.query(
        `SELECT e.*, c.name as category
         FROM expenses e
         LEFT JOIN expense_categories c ON e.category_id = c.id
         WHERE e.id = ?`,
        [id]
      );
      return rows[0];
    }
  },
  Mutation: {
    async createExpense(args: any) {
      const { company_id, user_id, description, amount, expense_date, category_id } = args;
      const [result]: any = await db.query(
        `INSERT INTO expenses (company_id, user_id, description, amount, expense_date, category_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [company_id, user_id, description, amount, expense_date, category_id]
      );
      // Fetch with join to include category name in response
      const [rows]: any = await db.query(
        `SELECT e.*, c.name as category
         FROM expenses e
         LEFT JOIN expense_categories c ON e.category_id = c.id
         WHERE e.id = ?`,
        [result.insertId]
      );
      return rows[0];
    },
    async updateExpense(args: any) {
      const { id, description, amount, expense_date, category_id } = args;
      await db.query(
        `UPDATE expenses
         SET description = ?, amount = ?, expense_date = ?, category_id = ?
         WHERE id = ?`,
        [description, amount, expense_date, category_id, id]
      );
      // Fetch with join to include category name in response
      const [rows]: any = await db.query(
        `SELECT e.*, c.name as category
         FROM expenses e
         LEFT JOIN expense_categories c ON e.category_id = c.id
         WHERE e.id = ?`,
        [id]
      );
      return rows[0];
    },  
    async deleteExpense(_: any, { id }: { id: number }) {
      await db.query("DELETE FROM expenses WHERE id = ?", [id]);
      return { success: true, message: "Expense deleted successfully" };
    }
  }
};
