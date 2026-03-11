import { createReport, getReportsByClient, getReportsByDate } from '../../models/reportModel';

interface Context {
  user?: {
    id: number;
    role: string;
    company_id: number;
  };
}

export const reportResolvers = {
  Query: {
    async reportsByClient(_: any, { client_id }: { client_id: number }, context: Context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      try {
        return await getReportsByClient(client_id);
      } catch (error) {
        console.error('Error fetching reports by client:', error);
        throw new Error('Failed to retrieve reports');
      }
    },

    async reportsByDate(_: any, { date }: { date: string }, context: Context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      try {
        return await getReportsByDate(date);
      } catch (error) {
        console.error('Error fetching reports by date:', error);
        throw new Error('Failed to retrieve reports');
      }
    }
  },

  Mutation: {
    async addReport(_: any, { client_id, date, content }: { client_id: number; date: string; content: string }, context: Context) {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      const author_id = context.user.id;
      // optionally validate client belongs to company
      return await createReport(client_id, author_id, date, content);
    }
  }
};
