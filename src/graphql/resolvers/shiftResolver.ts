import { getShiftsByEmployee, createShift, updateShift } from "../../models/shiftModel";
import { db } from "../../models/db";
import { Shift } from "../../types/shift";
import {canInsertShift, canUpdateShift,canDeleteShift} from "../../middleware/roles";



export const shiftResolvers = {
  Query: {
    async shiftsByEmployee(_: any, { employee_id }: { employee_id: number }, context: any): Promise<Shift[]> {
      return await getShiftsByEmployee(employee_id);
    }
  },
  Mutation: {
    async addShift(
      parent: any,
      { employee_id, client_id, date, start_time, end_time, hourly_rate, break_duration }: any,
      context: any
    ): Promise<Shift> {
      canInsertShift(context.user);
      return await createShift(employee_id, client_id, date, start_time, end_time, break_duration, hourly_rate, context.user.id);
    },
    async updateShift(
      parent: any,
      { id, date, start_time, end_time, hourly_rate, break_duration }: any,
      context: any
    ): Promise<Shift> {
      if (!context.user) {
        throw new Error("Not authorized.");
      }
      canUpdateShift(context.user);
      return await updateShift(id, date, start_time, end_time, hourly_rate, break_duration, context.user.id);
    },
    async deleteShift(_: any, { id }: { id: number }, context: any): Promise<boolean> {
      if (!context.user) {
        throw new Error("Not authorized.");
      }
      canDeleteShift(context.user);
      const [result]: any = await db.query("DELETE FROM shifts WHERE id = ?", [id]);
      return result.affectedRows > 0;
    }
  }
};
