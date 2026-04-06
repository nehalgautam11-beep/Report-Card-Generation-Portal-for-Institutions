import PDFDocument from "pdfkit";
import { StudentData } from "./pdfGenerator";
import fs from "fs";
import path from "path";

export const generateFeedbackFormPDF = (students: StudentData[], logoBuffer?: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });
      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const ORANGE_PRIMARY = "#f97316"; // Brand Orange from Image 2
      const BLACK          = "#000000";
      const BORDER_COLOR   = "#cbd5e1";
      const MARGIN         = 40;
      const PAGE_W         = doc.page.width;

      // ─── HEADER (Consistent with Image 2) ─────────────────────────
      // Logo on left
      if (logoBuffer) {
        try { doc.image(logoBuffer, MARGIN, 30, { width: 55 }); } catch (_) {}
      } else {
        const logoPath = path.join(process.cwd(), "public", "gis_logo.png");
        if (fs.existsSync(logoPath)) {
          try { doc.image(logoPath, MARGIN, 30, { width: 55 }); } catch (_) {}
        }
      }

      // School Name (Bold Orange)
      doc.font("Helvetica-Bold").fontSize(26).fillColor(ORANGE_PRIMARY);
      doc.text("GLOBAL INNOVATIVE SCHOOL", 110, 38);

      // Sub-header (Bold Black)
      doc.font("Helvetica-Bold").fontSize(14).fillColor(BLACK);
      doc.text("Teacher Assessment & Feedback Form", 110, 70);

      // Horizontal separator line (Gray)
      doc.moveTo(MARGIN, 100).lineTo(PAGE_W - MARGIN, 100).strokeColor(BORDER_COLOR).lineWidth(1).stroke();

      // ─── TABLE HEADER ─────────────────────────────────────────────
      const startY = 130;
      const col1W = 120;
      const col3W = 120;
      const col2W = PAGE_W - (MARGIN * 2) - col1W - col3W;

      const x1 = MARGIN;
      const x2 = x1 + col1W;
      const x3 = x2 + col2W;

      const H_ROW = 45;

      // Draw Header Border & Vertical lines
      doc.rect(x1, startY, PAGE_W - MARGIN * 2, H_ROW).strokeColor(BORDER_COLOR).lineWidth(1.2).stroke();
      doc.moveTo(x2, startY).lineTo(x2, startY + H_ROW).stroke();
      doc.moveTo(x3, startY).lineTo(x3, startY + H_ROW).stroke();

      // Header Text (Directly matching Image 2)
      doc.font("Helvetica-Bold").fontSize(11).fillColor(ORANGE_PRIMARY);
      doc.text("STUDENT NAME", x1 + 10, startY + 16);
      doc.text("REMARK", x2 + 10, startY + 16);
      doc.text("SIGNATURE", x3 + 10, startY + 16);

      // ─── TABLE ROWS ────────────────────────────────────────────────
      let y = startY + H_ROW;
      const ROW_H = 60; // Spacious for signing

      students.forEach((student, index) => {
        // Handle pagination
        if (y + ROW_H > doc.page.height - MARGIN - 20) {
          doc.addPage({ size: "A4", layout: "landscape", margin: 40 });
          // Redraw header on new page for professionalism
          doc.font("Helvetica-Bold").fontSize(12).fillColor(ORANGE_PRIMARY).text("GLOBAL INNOVATIVE SCHOOL - Feedback Form (Cont.)", MARGIN, 25);
          y = 50;
          doc.rect(x1, y, PAGE_W - MARGIN * 2, H_ROW).strokeColor(BORDER_COLOR).stroke();
          doc.moveTo(x2, y).lineTo(x2, y + H_ROW).stroke();
          doc.moveTo(x3, y).lineTo(x3, y + H_ROW).stroke();
          doc.text("STUDENT NAME", x1 + 10, y + 16);
          doc.text("REMARK", x2 + 10, y + 16);
          doc.text("SIGNATURE", x3 + 10, y + 16);
          y += H_ROW;
        }

        // Draw Row Border
        doc.rect(x1, y, PAGE_W - MARGIN * 2, ROW_H).strokeColor(BORDER_COLOR).stroke();
        
        // Vertical Separators
        doc.moveTo(x2, y).lineTo(x2, y + ROW_H).stroke();
        doc.moveTo(x3, y).lineTo(x3, y + ROW_H).stroke();

        // Data (Bold Black Name)
        doc.font("Helvetica-Bold").fontSize(10).fillColor(BLACK);
        doc.text(student.name.toUpperCase(), x1 + 10, y + 25, { width: col1W - 20, ellipsis: true });
        
        // Remarks & Signature left blank for manual fill as per design
        y += ROW_H;
      });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};
