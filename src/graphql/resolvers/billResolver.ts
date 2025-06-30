import { db } from "../../models/db";

export const billResolvers = {
  Query: {
    async billsByExpense(_: any, { expense_id }: { expense_id: number }) {
      const [rows]: any = await db.query(
        "SELECT * FROM bills WHERE expense_id = ? ORDER BY bill_date DESC",
        [expense_id]
      );
      return rows;
    },
    async bill(_: any, { id }: { id: number }) {
      const [rows]: any = await db.query("SELECT * FROM bills WHERE id = ?", [id]);
      return rows[0];
    }
  },
  Mutation: {
    async createBill(args: any) {
      const {
        expense_id,
        bill_number,
        bill_date,
        due_date,
        supplier,
        amount,
        vat,
        file_url,
      } = args;
      const [result]: any = await db.query(
        `INSERT INTO bills
        (expense_id, bill_number, bill_date, due_date, supplier, amount, vat, file_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expense_id,
          bill_number,
          bill_date,
          due_date,
          supplier,
          amount,
          vat,
          file_url,
        ]
      );
      const [rows]: any = await db.query("SELECT * FROM bills WHERE id = ?", [result.insertId]);
      return rows[0];
    }
  }
};
