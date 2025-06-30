import { db } from "../../models/db";
import { generatePaylistPDF } from "../../utils/pdfUtils";

export const paylistResolvers = {
  Query: {
    async paylistsByEmployee({ employee_id }: { employee_id: number }) {
      const [rows]: any = await db.query(
        "SELECT * FROM paylists WHERE employee_id = ? ORDER BY month DESC",
        [employee_id]
      );
      return rows;
    }
  },
  Mutation: {
    async addPaylist(args: any, context: any) {
      const { employee_id, month } = args;
      // Fetch employee info including company_id
      const [[employee]]: any = await db.query("SELECT name, email, company_id FROM users WHERE id = ?", [employee_id]);
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
        company // Only used for PDF, not for SQL
      );
      // Save paylist record with company_id (do NOT try to insert company fields here)
      const [result]: any = await db.query(
        "INSERT INTO paylists (company_id, employee_id, month, pdf_url) VALUES (?, ?, ?, ?)",
        [employee.company_id, employee_id, month, pdfPath]
      );
      return {
        id: result.insertId,
        employee_id,
        month,
        pdf_url: pdfPath
      };
    }
    
  }
};
