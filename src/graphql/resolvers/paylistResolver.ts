import { db } from "../../models/db";
import { generatePaylistPDF } from "../../utils/pdfUtils";
import { Paylist } from "../../types/paylist";
import { canCreatePaylist } from "../../middleware/roles";
import { assertAuthenticated, resolveViewerCompanyId } from "../auth/userAccess";
import {
  assertEmployeeInCompany,
  assertViewerMayAccessPaylist,
} from "../helpers/tenantChecks";

async function preparePaylistData(employee_id: number, month: string) {
  const monthDate = month.length === 7 ? `${month}-01` : month;

  const [[employee]]: any = await db.query(
    "SELECT name, email, company_id FROM users WHERE id = ?",
    [employee_id]
  );
  if (!employee) throw new Error("Employee not found");

  const [[company]]: any = await db.query(
    "SELECT name, org_number, address, zip_code, city, country, phone, email, vat_number FROM companies WHERE id = ?",
    [employee.company_id]
  );

  const monthForQuery = month.slice(0, 7);
  const [shiftRows]: any = await db.query(
    "SELECT date, start_time, end_time, hourly_rate FROM shifts WHERE employee_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?",
    [employee_id, monthForQuery]
  );

  let total = 0;
  shiftRows.forEach((shift: any) => {
    const start = parseInt(shift.start_time.split(":")[0]);
    const end = parseInt(shift.end_time.split(":")[0]);
    total += (end - start) * shift.hourly_rate;
  });

  const pdfPath = await generatePaylistPDF(
    employee.name,
    employee.email,
    month,
    shiftRows,
    total,
    company
  );

  return { employee, company, shiftRows, total, pdfPath, monthDate };
}

export const paylistResolvers = {
  Paylist: {
    async employee_name(parent: any) {
      const [[employee]]: any = await db.query("SELECT name FROM users WHERE id = ?", [
        parent.employee_id,
      ]);
      return employee?.name || null;
    },
    async employee_email(parent: any) {
      const [[employee]]: any = await db.query("SELECT email FROM users WHERE id = ?", [
        parent.employee_id,
      ]);
      return employee?.email || null;
    },
  },
  Query: {
    async paylistsByEmployee(
      _: any,
      { employee_id }: { employee_id: number },
      context: any
    ): Promise<Paylist[]> {
      assertAuthenticated(context.user);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const eid = Number(employee_id);
      await assertEmployeeInCompany(eid, viewerCompany);
      if (
        context.user.role === "employee" &&
        Number(eid) !== Number(context.user.id)
      ) {
        throw new Error("Not authorized to view paylists for this employee.");
      }

      const [rows]: any = await db.query(
        "SELECT * FROM paylists WHERE employee_id = ? ORDER BY month DESC",
        [eid]
      );
      return rows;
    },

    async paylistById(_: any, { id }: { id: number }, context: any): Promise<Paylist | null> {
      assertAuthenticated(context.user);
      const [[paylist]]: any = await db.query("SELECT * FROM paylists WHERE id = ?", [
        Number(id),
      ]);
      if (!paylist) return null;
      await assertViewerMayAccessPaylist(context.user, paylist);
      return paylist;
    },
  },
  Mutation: {
    async addPaylist(_: any, args: any, context: any): Promise<Paylist> {
      canCreatePaylist(context.user);
      assertAuthenticated(context.user);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      const employee_id = Number(args.employee_id);
      await assertEmployeeInCompany(employee_id, viewerCompany);

      const { month } = args;
      const { employee, pdfPath, monthDate } = await preparePaylistData(employee_id, month);

      const [result]: any = await db.query(
        "INSERT INTO paylists (company_id, employee_id, month, pdf_url) VALUES (?, ?, ?, ?)",
        [employee.company_id, employee_id, monthDate, pdfPath]
      );

      return {
        id: result.insertId,
        company_id: employee.company_id,
        employee_id,
        month: monthDate,
        pdf_url: pdfPath,
      };
    },

    async updatePaylist(_: any, { id, month }: { id: number; month: string }, context: any): Promise<Paylist> {
      assertAuthenticated(context.user);
      canCreatePaylist(context.user);

      const [[paylist]]: any = await db.query("SELECT * FROM paylists WHERE id = ?", [
        Number(id),
      ]);
      if (!paylist) throw new Error("Paylist not found");

      const viewerCompany = await resolveViewerCompanyId(context.user);
      if (Number(paylist.company_id) !== viewerCompany) {
        throw new Error("Not authorized to update this paylist.");
      }

      const { pdfPath, monthDate } = await preparePaylistData(paylist.employee_id, month);

      await db.query("UPDATE paylists SET month = ?, pdf_url = ? WHERE id = ?", [
        monthDate,
        pdfPath,
        id,
      ]);

      return {
        ...paylist,
        month: monthDate,
        pdf_url: pdfPath,
      };
    },
  },
};
