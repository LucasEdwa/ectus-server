import {
  createReport,
  getReportsByClient,
  getReportsByDateForCompany,
} from "../../models/reportModel";
import { assertAuthenticated, resolveViewerCompanyId } from "../auth/userAccess";
import { getClientCompanyId } from "../helpers/tenantChecks";

interface Context {
  user?: {
    id: number;
    role: string;
    company_id?: number;
  };
}

export const reportResolvers = {
  Query: {
    async reportsByClient(_: any, { client_id }: { client_id: number }, context: Context) {
      assertAuthenticated(context.user);
      const viewerCompany = await resolveViewerCompanyId(context.user!);
      const clientCompany = await getClientCompanyId(Number(client_id));
      if (clientCompany === null) {
        throw new Error("Client not found");
      }
      if (Number(clientCompany) !== viewerCompany) {
        throw new Error("Not authorized to view reports for this client.");
      }
      try {
        return await getReportsByClient(Number(client_id));
      } catch (error) {
        console.error("Error fetching reports by client:", error);
        throw new Error("Failed to retrieve reports");
      }
    },

    async reportsByDate(_: any, { date }: { date: string }, context: Context) {
      assertAuthenticated(context.user);
      try {
        const viewerCompany = await resolveViewerCompanyId(context.user!);
        return await getReportsByDateForCompany(date, viewerCompany);
      } catch (error) {
        console.error("Error fetching reports by date:", error);
        throw new Error("Failed to retrieve reports");
      }
    },
  },

  Mutation: {
    async addReport(
      _: any,
      { client_id, date, content }: { client_id: number; date: string; content: string },
      context: Context
    ) {
      assertAuthenticated(context.user);
      const viewerCompany = await resolveViewerCompanyId(context.user!);
      const clientCompany = await getClientCompanyId(Number(client_id));
      if (clientCompany === null) {
        throw new Error("Client not found");
      }
      if (Number(clientCompany) !== viewerCompany) {
        throw new Error("Not authorized to add reports for this client.");
      }
      const author_id = context.user!.id;
      return await createReport(Number(client_id), author_id, date, content);
    },
  },
};
