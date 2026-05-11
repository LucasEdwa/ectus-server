import { db } from "../../models/db";
import { parseInput } from "../../validation/parse";
import {
  expenseCategoryCreateSchema,
  expenseCategoryIdSchema,
  expenseCategoryUpdateSchema,
  expenseCompanyFilterSchema,
} from "../../validation/schemas";
import { assertAuthenticated, resolveViewerCompanyId } from "../auth/userAccess";
import { assertCanManageExpenses } from "../auth/expenseAccess";
import { getExpenseCategoryCompanyId } from "../helpers/tenantChecks";

export const expenseCategoryResolvers = {
  Query: {
    async expenseCategories(_: unknown, rawArgs: { company_id?: unknown }, context: any) {
      assertAuthenticated(context.user);
      const args = parseInput(expenseCompanyFilterSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const cid = args.company_id ?? viewerCompany;
      if (Number(cid) !== viewerCompany) {
        throw new Error("Not authorized to view categories for this company.");
      }
      const [rows]: any = await db.query(
        "SELECT * FROM expense_categories WHERE company_id = ? ORDER BY name ASC",
        [cid]
      );
      return rows;
    },

    async expenseCategory(_: unknown, rawArgs: { id: unknown }, context: any) {
      assertAuthenticated(context.user);
      const { id } = parseInput(expenseCategoryIdSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const [rows]: any = await db.query("SELECT * FROM expense_categories WHERE id = ?", [id]);
      const row = rows[0];
      if (!row) return null;
      if (Number(row.company_id) !== viewerCompany) {
        throw new Error("Not authorized to view this category.");
      }
      return row;
    },
  },

  Mutation: {
    async createExpenseCategory(_: unknown, rawArgs: unknown, context: any) {
      assertAuthenticated(context.user);
      assertCanManageExpenses(context.user);
      const args = parseInput(expenseCategoryCreateSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      if (Number(args.company_id) !== viewerCompany) {
        throw new Error("Not authorized to create categories for this company.");
      }

      const [result]: any = await db.query(
        "INSERT INTO expense_categories (company_id, name, description) VALUES (?, ?, ?)",
        [args.company_id, args.name, args.description ?? null]
      );
      const [rows]: any = await db.query("SELECT * FROM expense_categories WHERE id = ?", [
        result.insertId,
      ]);
      return rows[0];
    },

    async updateExpenseCategory(_: unknown, rawArgs: unknown, context: any) {
      assertAuthenticated(context.user);
      assertCanManageExpenses(context.user);
      const args = parseInput(expenseCategoryUpdateSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const catCompany = await getExpenseCategoryCompanyId(args.id);
      if (catCompany === null) {
        throw new Error("Expense category not found");
      }
      if (Number(catCompany) !== viewerCompany) {
        throw new Error("Not authorized to update this category.");
      }

      const sets: string[] = [];
      const values: unknown[] = [];
      if (args.name !== undefined) {
        sets.push("name = ?");
        values.push(args.name);
      }
      if (args.description !== undefined) {
        sets.push("description = ?");
        values.push(args.description ?? null);
      }
      if (sets.length === 0) {
        throw new Error("No fields to update");
      }
      values.push(args.id);

      const [result]: any = await db.query(
        `UPDATE expense_categories SET ${sets.join(", ")} WHERE id = ?`,
        values
      );
      if (result.affectedRows === 0) {
        throw new Error("Expense category not found");
      }
      const [rows]: any = await db.query("SELECT * FROM expense_categories WHERE id = ?", [args.id]);
      return rows[0];
    },

    async deleteExpenseCategory(_: unknown, rawArgs: { id: unknown }, context: any) {
      assertAuthenticated(context.user);
      assertCanManageExpenses(context.user);
      const { id } = parseInput(expenseCategoryIdSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const catCompany = await getExpenseCategoryCompanyId(id);
      if (catCompany === null) {
        throw new Error("Expense category not found");
      }
      if (Number(catCompany) !== viewerCompany) {
        throw new Error("Not authorized to delete this category.");
      }
      const [result]: any = await db.query("DELETE FROM expense_categories WHERE id = ?", [id]);
      if (result.affectedRows === 0) {
        throw new Error("Expense category not found");
      }
      return { message: "Expense category deleted successfully" };
    },
  },
};
