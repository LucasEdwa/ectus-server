import {
  createTimeBalance,
  getOrCreateTimeBalanceByEmployeeId,
  getTimeBalanceById,
  updateTimeBalance,
  getTimeBalancesByCompanyId,
  deleteTimeBalance,
} from "../../models/timeBalanceModel";
import { TimeBalance, CreateTimeBalanceInput, UpdateTimeBalanceInput } from "../../types/balance";
import { assertAuthenticated, resolveViewerCompanyId } from "../auth/userAccess";
import { assertEmployeeInCompany } from "../helpers/tenantChecks";
import { canManageWorkforceRecords } from "../../middleware/roles";

export const timeBalanceResolvers = {
  TimeBalance: {
    employee_name: (parent: any) => parent.employee_name,
    employee_email: (parent: any) => parent.employee_email,
  },
  Query: {
    async timeBalanceById(_: any, { id }: { id: number }, context: any): Promise<TimeBalance | null> {
      assertAuthenticated(context.user);
      const balance = await getTimeBalanceById(Number(id));
      if (!balance) return null;
      const viewerCompany = await resolveViewerCompanyId(context.user);
      await assertEmployeeInCompany(balance.employee_id, viewerCompany);
      if (
        context.user.role === "employee" &&
        Number(balance.employee_id) !== Number(context.user.id)
      ) {
        throw new Error("Not authorized to view this time balance.");
      }
      return balance;
    },

    async myTimeBalance(_: any, __: any, context: any): Promise<TimeBalance | null> {
      assertAuthenticated(context.user);
      try {
        return await getOrCreateTimeBalanceByEmployeeId(context.user.id);
      } catch (error: any) {
        console.error("Error in myTimeBalance resolver:", error);
        throw new Error(`Failed to get time balance: ${error?.message || "Unknown error"}`);
      }
    },

    async timeBalancesByCompany(
      _: any,
      { company_id }: { company_id: number },
      context: any
    ): Promise<TimeBalance[]> {
      assertAuthenticated(context.user);
      canManageWorkforceRecords(context.user);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      if (Number(company_id) !== viewerCompany) {
        throw new Error("Not authorized to view time balances for this company.");
      }
      return await getTimeBalancesByCompanyId(Number(company_id));
    },
  },

  Mutation: {
    async createTimeBalance(
      _: any,
      { input }: { input: CreateTimeBalanceInput },
      context: any
    ): Promise<TimeBalance> {
      assertAuthenticated(context.user);
      canManageWorkforceRecords(context.user);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      await assertEmployeeInCompany(input.employee_id, viewerCompany);
      return await createTimeBalance(input);
    },

    async updateTimeBalance(
      _: any,
      { id, input }: { id: number; input: UpdateTimeBalanceInput },
      context: any
    ): Promise<TimeBalance> {
      assertAuthenticated(context.user);
      canManageWorkforceRecords(context.user);
      const balance = await getTimeBalanceById(Number(id));
      if (!balance) {
        throw new Error("Time balance not found.");
      }
      const viewerCompany = await resolveViewerCompanyId(context.user);
      await assertEmployeeInCompany(balance.employee_id, viewerCompany);

      const result = await updateTimeBalance(Number(id), input);
      if (!result) throw new Error("Time balance not found.");
      return result;
    },

    async deleteTimeBalance(_: any, { id }: { id: number }, context: any): Promise<boolean> {
      assertAuthenticated(context.user);
      canManageWorkforceRecords(context.user);
      const balance = await getTimeBalanceById(Number(id));
      if (!balance) {
        return false;
      }
      const viewerCompany = await resolveViewerCompanyId(context.user);
      await assertEmployeeInCompany(balance.employee_id, viewerCompany);
      return await deleteTimeBalance(Number(id));
    },
  },
};
