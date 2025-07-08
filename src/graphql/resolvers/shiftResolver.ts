import { getShiftsByEmployee, createShift, updateShift } from "../../models/shiftModel";
import { db } from "../../models/db";
import { Shift } from "../../types/shift";

function verifyFinanceRole(user: any) {
  if (!user || user.role !== "finance") {
    throw new Error("Only finance users can add shifts.");
  }
}

export const shiftResolvers = {
  Query: {
    async shiftsByEmployee(_: any, { employee_id }: { employee_id: number }, context: any): Promise<Shift[]> {
      return await getShiftsByEmployee(employee_id);
    }
  },
  Mutation: {
    async addShift(
      _: any,
      { employee_id, date, start_time, end_time, hourly_rate, break_duration }: any,
      context: any
    ): Promise<Shift> {
    
      verifyFinanceRole(context.user);
      return await createShift(employee_id, date, start_time, end_time, break_duration, hourly_rate);
    },
    async updateShift(
      _: any,
      { id, date, start_time, end_time, hourly_rate, break_duration }: any,
      context: any
    ): Promise<Shift> {
      if (!context.user) {
        throw new Error("Not authorized.");
      }
      // Optionally, add further checks for update authorization here
      return await updateShift(id, date, start_time, end_time, hourly_rate, break_duration);
    },
    async deleteShift(_: any, { id }: { id: number }, context: any): Promise<boolean> {
      if (!context.user) {
        throw new Error("Not authorized.");
      }
      // Optionally, add further checks for delete authorization here
      const [result]: any = await db.query("DELETE FROM shifts WHERE id = ?", [id]);
      return result.affectedRows > 0;
    }
  }
};
