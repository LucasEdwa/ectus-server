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
    async addPaylist(args: any) {
      const { employee_id, month } = args;
      // Fetch employee name and email
      const [[employee]]: any = await db.query("SELECT name, email FROM users WHERE id = ?", [employee_id]);
      // Fetch shifts for the month
      const shiftsResult: any = await db.query(
        "SELECT date, start_time, end_time, hourly_rate FROM shifts WHERE employee_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?",
        [employee_id, month.slice(0, 7)]
      );
      const shiftRows = shiftsResult[0];
      // Calculate total salary
      let total = 0;
      shiftRows.forEach((shift: any) => {
        const start = parseInt(shift.start_time.split(":")[0]);
        const end = parseInt(shift.end_time.split(":")[0]);
        total += (end - start) * shift.hourly_rate;
      });
      // Generate PDF and get file path
      const pdfPath = await generatePaylistPDF(employee.name, employee.email, month, shiftRows, total);
      // Save paylist record
      const [result]: any = await db.query(
        "INSERT INTO paylists (employee_id, month, pdf_url) VALUES (?, ?, ?)",
        [employee_id, month, pdfPath]
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
