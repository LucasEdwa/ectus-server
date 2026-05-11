import { getShiftsByEmployee, createShift, updateShift } from "../../models/shiftModel";
import { db } from "../../models/db";
import { Shift } from "../../types/shift";
import { canInsertShift, canUpdateShift, canDeleteShift, canViewShift } from "../../middleware/roles";
import { parseInput } from "../../validation/parse";
import {
  shiftDeleteSchema,
  shiftMutationSchema,
  shiftUpdateSchema,
  shiftsByEmployeeSchema,
} from "../../validation/schemas";
import { assertAuthenticated, resolveViewerCompanyId } from "../auth/userAccess";
import { assertEndAfterStart } from "../../utils/timeValidation";
import {
  assertClientInCompany,
  assertEmployeeInCompany,
  getShiftEmployeeCompanyId,
} from "../helpers/tenantChecks";

export const shiftResolvers = {
  Query: {
    async shiftsByEmployee(
      _: unknown,
      rawArgs: { employee_id: unknown },
      context: any
    ): Promise<Shift[]> {
      assertAuthenticated(context.user);
      canViewShift(context.user);
      const { employee_id } = parseInput(shiftsByEmployeeSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      await assertEmployeeInCompany(employee_id, viewerCompany);
      if (
        context.user.role === "employee" &&
        Number(employee_id) !== Number(context.user.id)
      ) {
        throw new Error("Not authorized to view shifts for this employee.");
      }
      return await getShiftsByEmployee(employee_id);
    },
  },
  Mutation: {
    async addShift(_: unknown, rawArgs: unknown, context: any): Promise<Shift> {
      canInsertShift(context.user);
      const args = parseInput(shiftMutationSchema, rawArgs);
      assertEndAfterStart(args.start_time, args.end_time);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      await assertEmployeeInCompany(args.employee_id, viewerCompany);
      await assertClientInCompany(args.client_id ?? null, viewerCompany);
      const breakDur = args.break_duration ?? "00:00:00";
      return await createShift(
        args.employee_id,
        args.client_id ?? null,
        args.date,
        args.start_time,
        args.end_time,
        breakDur,
        args.hourly_rate,
        context.user.id
      );
    },
    async updateShift(_: unknown, rawArgs: unknown, context: any): Promise<Shift> {
      if (!context.user) {
        throw new Error("Not authorized.");
      }
      canUpdateShift(context.user);
      const args = parseInput(shiftUpdateSchema, rawArgs);
      assertEndAfterStart(args.start_time, args.end_time);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const shiftCompany = await getShiftEmployeeCompanyId(args.id);
      if (shiftCompany === null || Number(shiftCompany) !== viewerCompany) {
        throw new Error("Shift not found or access denied.");
      }
      const breakDur = args.break_duration ?? "00:00:00";
      return await updateShift(
        args.id,
        args.date,
        args.start_time,
        args.end_time,
        args.hourly_rate,
        breakDur,
        context.user.id
      );
    },
    async deleteShift(_: unknown, rawArgs: unknown, context: any): Promise<boolean> {
      if (!context.user) {
        throw new Error("Not authorized.");
      }
      canDeleteShift(context.user);
      const { id } = parseInput(shiftDeleteSchema, rawArgs);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const shiftCompany = await getShiftEmployeeCompanyId(id);
      if (shiftCompany === null || Number(shiftCompany) !== viewerCompany) {
        throw new Error("Shift not found or access denied.");
      }
      const [result]: any = await db.query("DELETE FROM shifts WHERE id = ?", [id]);
      return result.affectedRows > 0;
    },
  },
};
