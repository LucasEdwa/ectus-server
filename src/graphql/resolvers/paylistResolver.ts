import { db } from "../../models/db";
import { generatePaylistPDF } from "../../utils/pdfUtils";
import { Paylist } from "../../types/paylist";
import { canCreatePaylist } from "../../middleware/roles";
async function preparePaylistData(employee_id: number, month: string) {
  // Fetch employee info including company_id
  const [[employee]]: any = await db.query(
    "SELECT name, email, company_id FROM users WHERE id = ?",
    [employee_id]
  );
  if (!employee) throw new Error("Employee not found");

  // Fetch company info for the paylist PDF
  const [[company]]: any = await db.query(
    "SELECT name, org_number, address, zip_code, city, country, phone, email, vat_number FROM companies WHERE id = ?",
    [employee.company_id]
  );

  // Fetch shifts for the month
  const [shiftRows]: any = await db.query(
    "SELECT date, start_time, end_time, hourly_rate FROM shifts WHERE employee_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?",
    [employee_id, month.slice(0, 7)]
  );

  // Calculate total salary
  let total = 0;
  shiftRows.forEach((shift: any) => {
    const start = parseInt(shift.start_time.split(":")[0]);
    const end = parseInt(shift.end_time.split(":")[0]);
    total += (end - start) * shift.hourly_rate;
  });

  // Generate PDF and get file path (pass company info)
  const pdfPath = await generatePaylistPDF(
    employee.name,
    employee.email,
    month,
    shiftRows,
    total,
    company
  );

  return { employee, company, shiftRows, total, pdfPath };
}


export const paylistResolvers = {
  Query: {
    async paylistsByEmployee(_: any, { employee_id }: { employee_id: number }, context: any): Promise<Paylist[]> {
      if (!context.user) throw new Error("Not authorized.");
      const [rows]: any = await db.query(
        "SELECT * FROM paylists WHERE employee_id = ? ORDER BY month DESC",
        [employee_id]
      );
      return rows;
    },

    async paylistById(_: any, { id }: { id: number }, context: any): Promise<Paylist | null> {
      if (!context.user) throw new Error("Not authorized.");
      const [[paylist]]: any = await db.query(
        "SELECT * FROM paylists WHERE id = ?",
        [id]
      );
      return paylist || null;
    }
  },
  Mutation: {
    async addPaylist(_: any, args: any, context: any): Promise<Paylist> {
      canCreatePaylist(context.user);
      const { employee_id, month } = args;
      const { employee, pdfPath } = await preparePaylistData(employee_id, month);

      const [result]: any = await db.query(
        "INSERT INTO paylists (company_id, employee_id, month, pdf_url) VALUES (?, ?, ?, ?)",
        [employee.company_id, employee_id, month, pdfPath]
      );

      return {
        id: result.insertId,
        company_id: employee.company_id,
        employee_id,
        month,
        pdf_url: pdfPath,
      };
    },

    async updatePaylist(_: any, { id, month }: { id: number; month: string }, context: any): Promise<Paylist> {
      if (!context.user) throw new Error("Not authorized.");
      canCreatePaylist(context.user);

      const [[paylist]]: any = await db.query(
        "SELECT * FROM paylists WHERE id = ?",
        [id]
      );
      if (!paylist) throw new Error("Paylist not found");

      const { employee, pdfPath } = await preparePaylistData(paylist.employee_id, month);

      await db.query(
        "UPDATE paylists SET month = ?, pdf_url = ? WHERE id = ?",
        [month, pdfPath, id]
      );

      return {
        ...paylist,
        month,
        pdf_url: pdfPath,
      };
    }
  },
};