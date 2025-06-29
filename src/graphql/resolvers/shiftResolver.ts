import { db } from "../../models/db";

export const shiftResolvers = {
  Query: {
    async shiftsByEmployee({ employee_id }: { employee_id: number }) {
      const [rows]: any = await db.query(
        "SELECT * FROM shifts WHERE employee_id = ? ORDER BY date DESC",
        [employee_id]
      );
      return rows;
    }
  },
  Mutation: {
    async addShift(args: any) {
      const { employee_id, date, start_time, end_time, hourly_rate } = args;
      const [result]: any = await db.query(
        "INSERT INTO shifts (employee_id, date, start_time, end_time, hourly_rate) VALUES (?, ?, ?, ?, ?)",
        [employee_id, date, start_time, end_time, hourly_rate]
      );
      return {
        id: result.insertId,
        employee_id,
        date,
        start_time,
        end_time,
        hourly_rate
      };
    }
  }
};
