import { db } from "../../models/db";

export const expenseCategoryResolvers = {
  Query: {
    async expenseCategories(_: any, { company_id }: { company_id?: number }) {
      if (company_id) {
        const [rows]: any = await db.query("SELECT * FROM expense_categories WHERE company_id = ?", [company_id]);
        return rows;
      }
      const [rows]: any = await db.query("SELECT * FROM expense_categories");
      return rows;
    },
    async expenseCategory(_: any, { id }: { id: number }) {
      const [rows]: any = await db.query("SELECT * FROM expense_categories WHERE id = ?", [id]);
      return rows[0];
    }
  },
  Mutation: {
    async createExpenseCategory(args: any) {
      const { company_id, name, description } = args;
      if (!company_id || !name) {
        throw new Error("company_id and name are required");
      }
      const [result]: any = await db.query(
        "INSERT INTO expense_categories (company_id, name, description) VALUES (?, ?, ?)",
        [company_id, name, description]
      );
      const [rows]: any = await db.query("SELECT * FROM expense_categories WHERE id = ?", [result.insertId]);
      return rows[0];
    },
    async updateExpenseCategory(args: any) {
      const { id, name, description } = args;
      const [result]: any = await db.query(
        "UPDATE expense_categories SET name = ?, description = ? WHERE id = ?",
        [name, description, id]
      );
      if (result.affectedRows === 0) {
        throw new Error("Expense category not found");
      }
      const [rows]: any = await db.query("SELECT * FROM expense_categories WHERE id = ?", [id]);
      return rows[0];
    },
    async deleteExpenseCategory(args: any) {
      const { id } = args;
      const [result]: any = await db.query("DELETE FROM expense_categories WHERE id = ?", [id]);
      if (result.affectedRows === 0) {
        throw new Error("Expense category not found");
      }
      return { message: "Expense category deleted successfully" };
    }
  }
};
