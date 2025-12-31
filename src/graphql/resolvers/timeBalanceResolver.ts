import { db } from '../../models/db';
import { 
  createTimeBalance, 
  getOrCreateTimeBalanceByEmployeeId, 
  getTimeBalanceById,
  updateTimeBalance, 
  getTimeBalancesByCompanyId,
  deleteTimeBalance
} from '../../models/timeBalanceModel';
import { TimeBalance, CreateTimeBalanceInput, UpdateTimeBalanceInput } from '../../types/balance';

export const timeBalanceResolvers = {
  TimeBalance: {
    // These fields are now included in the query with JOINs
    employee_name: (parent: any) => parent.employee_name,
    employee_email: (parent: any) => parent.employee_email,
  },
  Query: {
    async timeBalanceById(_: any, { id }: { id: number }, context: any): Promise<TimeBalance | null> {
      if (!context.user) throw new Error("Not authorized.");
      return await getTimeBalanceById(id);
    },

    async myTimeBalance(_: any, __: any, context: any): Promise<TimeBalance | null> {
      if (!context.user) throw new Error("Not authorized.");
      
      try {
        console.log(`Getting time balance for user ${context.user.id}`);
        const balance = await getOrCreateTimeBalanceByEmployeeId(context.user.id);
        console.log(`Retrieved balance:`, balance);
        return balance;
      } catch (error: any) {
        console.error('Error in myTimeBalance resolver:', error);
        throw new Error(`Failed to get time balance: ${error?.message || 'Unknown error'}`);
      }
    },

    async timeBalancesByCompany(_: any, { company_id }: { company_id: number }, context: any): Promise<TimeBalance[]> {
      if (!context.user) throw new Error("Not authorized.");
      return await getTimeBalancesByCompanyId(company_id);
    },
  },

  Mutation: {
    async createTimeBalance(_: any, { input }: { input: CreateTimeBalanceInput }, context: any): Promise<TimeBalance> {
      if (!context.user) throw new Error("Not authorized.");
      return await createTimeBalance(input);
    },

    async updateTimeBalance(_: any, { id, input }: { id: number; input: UpdateTimeBalanceInput }, context: any): Promise<TimeBalance> {
      if (!context.user) throw new Error("Not authorized.");
      const result = await updateTimeBalance(id, input);
      if (!result) throw new Error("Time balance not found.");
      return result;
    },

    async deleteTimeBalance(_: any, { id }: { id: number }, context: any): Promise<boolean> {
      if (!context.user) throw new Error("Not authorized.");
      return await deleteTimeBalance(id);
    },
  },
};