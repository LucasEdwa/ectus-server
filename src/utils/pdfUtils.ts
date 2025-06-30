import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";


export const generatePaylistPDF = async (
  employeeName: string,
  employeeEmail: string,
  month: string,
  shifts: { date: string; start_time: string; end_time: string; hourly_rate: number }[],
  total: number,
  company: {
    name: string;
    org_number: string;
    address: string;
    zip_code: string;
    city: string;
    country: string;
    phone?: string;
    email?: string;
    vat_number?: string;
  }
): Promise<string> => {
  const doc = new PDFDocument({ margin: 50 });
  const fileName = `paylist-${employeeName.replace(/\s+/g, "_")}-${month}.pdf`;
  const filePath = path.join(__dirname, "../../paylists", fileName);

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

  // Calculate taxes and liquid (net) salary
  const taxes = +(total * 0.288).toFixed(2);
  const liquid = +(total - taxes).toFixed(2);

  // Header rectangle with company info (except bank info)
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const infoRectHeight = 120;
  const infoRectY = doc.page.margins.top;
  const infoRectX = doc.page.margins.left;

  doc
    .rect(infoRectX, infoRectY, pageWidth, infoRectHeight)
    .fillAndStroke("#F2F3F4", "#2E86C1");

  // Define columns for the 3 "divs"
  const colWidth = pageWidth / 3;
  const leftX = infoRectX + 10;
  const centerX = infoRectX + colWidth + 10;
  const rightX = infoRectX + 2 * colWidth + 10;
  let y = infoRectY + 16;

  // Left: Company data
  doc
    .fillColor("#2E86C1")
    .fontSize(12)
    .text(company.name, leftX, y, { width: colWidth - 20, align: "left" })
    .fontSize(10)
    .fillColor("#000")
    .text(`Org.nr: ${company.org_number}`, leftX, y + 20, { width: colWidth - 20, align: "left" })
    .text(`Address: ${company.address}`, leftX, y + 34, { width: colWidth - 20, align: "left" })
    .text(`Zip: ${company.zip_code}`, leftX, y + 48, { width: colWidth - 20, align: "left" })
    .text(`City: ${company.city}`, leftX, y + 62, { width: colWidth - 20, align: "left" })
    .text(`Phone: ${company.phone || ""}`, leftX, y + 75, { width: colWidth - 20, align: "left" })
    .text(`Email: ${company.email || ""}`, leftX, y + 88, { width: colWidth - 20, align: "left" });

  // Center: VAT only
  doc
    .fontSize(14)
    .fillColor("#2E86C1")
    .text("VAT Number", centerX, y, { width: colWidth - 20, align: "center" })
    .fontSize(12)
    .fillColor("#000")
    .text(company.vat_number || "", centerX, y + 20, { width: colWidth - 20, align: "center" });

  // Right: Employee data
  doc
    .fontSize(14)
    .fillColor("#2E86C1")
    .text("Employee", rightX, y, { width: colWidth - 20, align: "left" })
    .fontSize(12)
    .fillColor("#000")
    .text(employeeName, rightX, y + 20, { width: colWidth - 20, align: "left" })
    .text(`Email: ${employeeEmail}`, rightX, y + 34, { width: colWidth - 20, align: "left" })
    .text(`Paylist Month: ${month}`, rightX, y + 48, { width: colWidth - 20, align: "left" });

  // Table rectangle
  const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
  const rectHeight = pageHeight * 0.7;
  const rectY = infoRectY + infoRectHeight + 20;
  const rectX = doc.page.margins.left;

  doc
    .rect(rectX, rectY, pageWidth, rectHeight)
    .stroke("#2E86C1");

  // Table headers
  const tableY = rectY + 30;
  doc.fontSize(14).fillColor("#2E86C1")
    .text("Description", rectX + 20, tableY)
    .text("Hours", rectX + 200, tableY, { width: 60, align: "right" })
    .text("Rate", rectX + 300, tableY, { width: 60, align: "right" })
    .text("Subtotal", rectX + 400, tableY, { width: 80, align: "right" });

  // Table row: Worked Hours
  const rowY = tableY + 25;
  doc.fontSize(12).fillColor("#000")
    .text("Worked Hours", rectX + 20, rowY)
    .text(`${totalHours}`, rectX + 200, rowY, { width: 60, align: "right" })
    .text(`$${hourlyRate}`, rectX + 300, rowY, { width: 60, align: "right" })
    .text(`$${total.toFixed(2)}`, rectX + 400, rowY, { width: 80, align: "right" });

  // Draw a full-width table at the bottom for totals (as a flex column: each value on its own row)
  const tableBottomY = rectY + rectHeight - 70;
  doc.fontSize(14);

  // Row 1: Total
  doc.fillColor("#000")
    .text("Total", rectX + 20, tableBottomY, { align: "left" })
    .fillColor("#117A65")
    .text(`$${total.toFixed(2)}`, rectX + pageWidth - 120, tableBottomY, { width: 100, align: "right" });

  // Row 2: Taxes
  doc.fillColor("#000")
    .text("Taxes (28.8%)", rectX + 20, tableBottomY + 22, { align: "left" })
    .fillColor("#C0392B")
    .text(`$${taxes.toFixed(2)}`, rectX + pageWidth - 120, tableBottomY + 22, { width: 100, align: "right" });

  // Row 3: Liquid
  doc.fillColor("#000")
    .text("Liquid", rectX + 20, tableBottomY + 44, { align: "left" })
    .fillColor("#117A65")
    .text(`$${liquid.toFixed(2)}`, rectX + pageWidth - 120, tableBottomY + 44, { width: 100, align: "right" });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return filePath;
};
