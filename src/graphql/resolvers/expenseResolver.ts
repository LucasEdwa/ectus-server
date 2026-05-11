import { db } from "../../models/db";
import { Expense } from "../../types/expense";
import { parseInput } from "../../validation/parse";
import {
  createExpenseSchema,
  expenseCompanyFilterSchema,
  expenseIdSchema,
  updateExpenseSchema,
} from "../../validation/schemas";
import { assertAuthenticated, resolveViewerCompanyId } from "../auth/userAccess";
import { assertCanManageExpenses } from "../auth/expenseAccess";
import { getExpenseCompanyId } from "../helpers/tenantChecks";

export const expenseResolvers = {
  Query: {
    async expenses(
      _: unknown,
      rawArgs: { company_id?: unknown },
      context: any
    ): Promise<Expense[]> {
      assertAuthenticated(context.user);
      const args = parseInput(expenseCompanyFilterSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const cid = args.company_id ?? viewerCompany;
      if (Number(cid) !== viewerCompany) {
        throw new Error("Not authorized to view expenses for this company.");
      }
      const [rows]: any = await db.query(
        `SELECT e.*, c.name as category
        FROM expenses e
        LEFT JOIN expense_categories c ON e.category_id = c.id
        WHERE e.company_id = ?
        ORDER BY e.expense_date DESC, e.id DESC`,
        [cid]
      );
      return rows;
    },

    async expense(_: unknown, rawArgs: { id: unknown }, context: any): Promise<Expense | null> {
      assertAuthenticated(context.user);
      const { id } = parseInput(expenseIdSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const [rows]: any = await db.query(
        `SELECT e.*, c.name as category
         FROM expenses e
         LEFT JOIN expense_categories c ON e.category_id = c.id
         WHERE e.id = ?`,
        [id]
      );
      const row = rows[0];
      if (!row) return null;
      if (Number(row.company_id) !== viewerCompany) {
        throw new Error("Not authorized to view this expense.");
      }
      return row;
    },
  },

  Mutation: {
    async createExpense(_: unknown, rawArgs: unknown, context: any): Promise<Expense> {
      assertAuthenticated(context.user);
      assertCanManageExpenses(context.user);
      const args = parseInput(createExpenseSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      if (Number(args.company_id) !== viewerCompany) {
        throw new Error("Not authorized to create expenses for this company.");
      }

      const user_id = args.user_id ?? context.user.id ?? null;
      const category_id = args.category_id ?? null;

      const [result]: any = await db.query(
        `INSERT INTO expenses (company_id, user_id, description, amount, expense_date, category_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [args.company_id, user_id, args.description, args.amount, args.expense_date, category_id]
      );

      const [rows]: any = await db.query(
        `SELECT e.*, c.name as category
         FROM expenses e
         LEFT JOIN expense_categories c ON e.category_id = c.id
         WHERE e.id = ?`,
        [result.insertId]
      );
      return rows[0];
    },

    async updateExpense(_: unknown, rawArgs: unknown, context: any): Promise<Expense> {
      assertAuthenticated(context.user);
      assertCanManageExpenses(context.user);
      const args = parseInput(updateExpenseSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      if (Number(args.company_id) !== viewerCompany) {
        throw new Error("Not authorized to update expenses for this company.");
      }

      const existingCompany = await getExpenseCompanyId(args.id);
      if (existingCompany === null) {
        throw new Error("Expense not found.");
      }
      if (Number(existingCompany) !== viewerCompany) {
        throw new Error("Not authorized to update this expense.");
      }

      const [existingRows]: any = await db.query(
        "SELECT user_id, category_id FROM expenses WHERE id = ?",
        [args.id]
      );
      const existing = existingRows[0];
      const user_id =
        args.user_id !== undefined ? args.user_id ?? null : existing?.user_id ?? null;
      const category_id =
        args.category_id !== undefined ? args.category_id ?? null : existing?.category_id ?? null;

      await db.query(
        `UPDATE expenses
         SET description = ?, amount = ?, expense_date = ?, category_id = ?, user_id = ?
         WHERE id = ?`,
        [args.description, args.amount, args.expense_date, category_id, user_id, args.id]
      );

      const [rows]: any = await db.query(
        `SELECT e.*, c.name as category
         FROM expenses e
         LEFT JOIN expense_categories c ON e.category_id = c.id
         WHERE e.id = ?`,
        [args.id]
      );
      return rows[0];
    },

    async deleteExpense(_: unknown, rawArgs: { id: unknown }, context: any): Promise<boolean> {
      assertAuthenticated(context.user);
      assertCanManageExpenses(context.user);
      const { id } = parseInput(expenseIdSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const existingCompany = await getExpenseCompanyId(id);
      if (existingCompany === null) {
        return false;
      }
      if (Number(existingCompany) !== viewerCompany) {
        throw new Error("Not authorized to delete this expense.");
      }
      await db.query("DELETE FROM expenses WHERE id = ?", [id]);
      return true;
    },
  },
};
