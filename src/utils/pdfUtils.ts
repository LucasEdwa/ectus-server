import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

/**
 * Generate a styled paylist PDF for an employee.
 * @param employeeName Name of the employee
 * @param employeeEmail Email of the employee
 * @param month Month string (e.g., "2024-06")
 * @param shifts Array of shift objects: { date, start_time, end_time, hourly_rate }
 * @param total Total salary for the month
 * @param companyName Name of the company
 * @returns The path to the generated PDF file
 */
export const generatePaylistPDF = async (
  employeeName: string,
  employeeEmail: string,
  month: string,
  shifts: { date: string; start_time: string; end_time: string; hourly_rate: number }[],
  total: number,
  companyName: string = "Ecstus Global Solutions"
): Promise<string> => {
  const doc = new PDFDocument({ margin: 50 });
  const fileName = `paylist-${employeeName.replace(/\s+/g, "_")}-${month}.pdf`;
  const filePath = path.join(__dirname, "../../paylists", fileName);

  // Ensure the output directory exists
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Calculate total hours and (assume all shifts have the same hourly_rate)
  let totalHours = 0;
  let hourlyRate = 0;
  shifts.forEach((shift) => {
    const start = parseInt(shift.start_time.split(":")[0]);
    const end = parseInt(shift.end_time.split(":")[0]);
    totalHours += end - start;
    hourlyRate = shift.hourly_rate;
  });

  // Rectangle for company and employee data (above the main square)
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const infoRectHeight = 70;
  const infoRectY = doc.page.margins.top;
  const infoRectX = doc.page.margins.left;

  doc
    .rect(infoRectX, infoRectY, pageWidth, infoRectHeight)
    .fillAndStroke("#F2F3F4", "#2E86C1");

  doc
    .fillColor("#2E86C1")
    .fontSize(16)
    .text(companyName, infoRectX + 20, infoRectY + 12, { align: "left" })
    .fillColor("#000")
    .fontSize(12)
    .text(`Employee: ${employeeName}`, infoRectX + 20, infoRectY + 36, { align: "left" })
    .text(`Email: ${employeeEmail}`, infoRectX + 20, infoRectY + 52, { align: "left" });

  // Draw a bordered "div" for the salary table and total
  const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
  const rectHeight = pageHeight * 0.8;
  const rectY = infoRectY + infoRectHeight + 20;
  const rectX = doc.page.margins.left;

  // Outer border for the whole section (including total)
  doc
    .rect(rectX, rectY, pageWidth, rectHeight)
    .stroke("#2E86C1");

  // Header: "Salary" and "14 24" (space-between)
  const headerY = rectY + 20;
  doc.fontSize(18).fillColor("#2E86C1").text("Salary", rectX + 20, headerY, { align: "left" });
  doc.fontSize(18).fillColor("#2E86C1").text("14 24", rectX + pageWidth - 60, headerY, { align: "left" });

  // Fields: Description, Unit, Value (space-between)
  const fieldsY = headerY + 40;
  doc.fontSize(12).fillColor("#000")
    .text("Description", rectX + 20, fieldsY, { width: 120, align: "left" })
    .text("Unit", rectX + pageWidth / 2 - 40, fieldsY, { width: 60, align: "left" })
    .text("Value", rectX + pageWidth - 100, fieldsY, { width: 80, align: "left" });

  // Example row: "Worked Hours", totalHours, hourlyRate
  const rowY = fieldsY + 30;
  doc.fontSize(14).fillColor("#000")
    .text("Worked Hours", rectX + 20, rowY, { width: 120, align: "left" })
    .text(`${totalHours}`, rectX + pageWidth / 2 - 40, rowY, { width: 60, align: "left" })
    .text(`$${hourlyRate}`, rectX + pageWidth - 100, rowY, { width: 80, align: "left" });

  // Draw a rectangle around the total at the bottom right
  const totalBoxWidth = 200;
  const totalBoxHeight = 40;
  const totalBoxX = rectX + pageWidth - totalBoxWidth - 20;
  const totalBoxY = rectY + rectHeight - totalBoxHeight - 20;

  doc
    .rect(totalBoxX, totalBoxY, totalBoxWidth, totalBoxHeight)
    .stroke("#117A65");

  doc.fontSize(16).fillColor("#117A65")
    .text(`Total: $${total.toFixed(2)}`, totalBoxX + 10, totalBoxY + 10, { width: totalBoxWidth - 20, align: "right" });

  doc.end();

  // Wait for the file to finish writing
  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return filePath;
};
