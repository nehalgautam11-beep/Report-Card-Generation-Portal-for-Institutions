import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export interface StudentData {
  name: string;
  fatherName: string;
  motherName: string;
  className: string;
  dob: string;
  qualities: string;
  workingDays: number;
  attendedDays: number;
  subjects: { name: string; marks: SubjectMarks }[];
  remarks?: string;
}

export interface SubjectMarks {
  periodicRaw: number; // Out of 20
  enrichment: number;  // Out of 10
  term2: number;       // Out of 80
}

const getGrade = (percentage: number): string => {
  if (percentage >= 91) return "A1";
  if (percentage >= 81) return "A2";
  if (percentage >= 71) return "B1";
  if (percentage >= 61) return "B2";
  if (percentage >= 51) return "C1";
  if (percentage >= 41) return "C2";
  if (percentage >= 33) return "D";
  return "E";
};

// Formats "JOHN DOE" to "John Doe"
const toTitleCase = (str: string): string => {
  return (str || "")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const generateReportCardPDF = (data: StudentData, logoBuffer?: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // ─── STYLING MATCHING THE IMAGE ────────────────────────────────
      const BLUE_BRAND  = "#174b8b"; // Deep blue
      const BLUE_HEADER = "#f0f5fa"; // Light blue background section
      const GREEN_ATT   = "#3aa853"; // Green for attendance labels
      const BLACK       = "#000000";
      const WHITE       = "#ffffff";
      const MARGIN_X    = 45;
      const PAGE_W      = doc.page.width;

      // ─── TOP HEADER BLOCK ──────────────────────────────────────────
      doc.rect(0, 0, PAGE_W, 115).fill(BLUE_HEADER);

      if (logoBuffer) {
        try { doc.image(logoBuffer, MARGIN_X, 15, { width: 68 }); } catch(_) {}
      } else {
        const logoPath = path.join(process.cwd(), "public", "gis_logo.png");
        if (fs.existsSync(logoPath)) {
          try { doc.image(logoPath, MARGIN_X, 15, { width: 68 }); } catch(_) {}
        }
      }

      doc.font("Helvetica-Bold").fontSize(24).fillColor(BLUE_BRAND);
      doc.text("GLOBAL INNOVATIVE SCHOOL", 140, 38);

      // White section starts here to allow the title to sit cleanly
      doc.rect(0, 115, PAGE_W, doc.page.height - 115).fill(WHITE);

      // Title
      doc.font("Helvetica-Bold").fontSize(18).fillColor(BLUE_BRAND)
         .text("REPORT CARD", 0, 130, { align: "center", width: PAGE_W });

      // ─── STUDENT DETAILS ──────────────────────────────────────────
      let y = 175;
      const colL = MARGIN_X;
      const colR = 300;
      const lineW = 160;

      const drawDetail = (label: string, value: string, x: number, ly: number, valueXOffset: number) => {
        doc.font("Helvetica-Bold").fontSize(10).fillColor(BLUE_BRAND).text(label, x, ly);
        
        // Value: Title Case for names, 11pt
        doc.font("Helvetica").fontSize(11).fillColor(BLACK).text(value, x + valueXOffset, ly);
        
        // Underline (light gray)
        doc.moveTo(x + valueXOffset - 5, ly + 14).lineTo(x + valueXOffset + lineW, ly + 14)
          .strokeColor("#e0e0e0").lineWidth(1).stroke();
      };

      drawDetail("NAME:", toTitleCase(data.name), colL, y, 70);
      drawDetail("Mother's Name:", toTitleCase(data.motherName), colR, y, 95);
      y += 28;
      
      // Kept class caps as requested, Title Case for the rest
      drawDetail("CLASS:", (data.className || "").toUpperCase(), colL, y, 70);
      drawDetail("Father's Name:", toTitleCase(data.fatherName), colR, y, 95);
      y += 28;
      drawDetail("DOB:", data.dob, colL, y, 70);

      y += 45;

      // ─── TABLE ─────────────────────────────────────────────────────
      const tableX = MARGIN_X;
      const tableW = PAGE_W - MARGIN_X * 2;
      const colPos = [0, 110, 230, 340, 435].map(v => v + tableX);

      const hH = 35;
      doc.rect(tableX, y, tableW, hH).fill(WHITE).strokeColor(BLUE_BRAND).lineWidth(1).stroke();
      for (let i = 1; i < colPos.length; i++) {
        doc.moveTo(colPos[i], y).lineTo(colPos[i], y + hH).stroke();
      }

      // Header Text - Bold and Deep Blue
      doc.font("Helvetica-Bold").fontSize(9).fillColor(BLUE_BRAND);
      doc.text("Subject", tableX + 5, y + 12);
      doc.text("Periodic Test - 2\n(Out of 10)", colPos[1] + 5, y + 6, { width: 115 });
      doc.text("Subject Enrichment\n(Out of 10)", colPos[2] + 5, y + 6, { width: 105 });
      doc.text("Term - 2 Examination\n(Out of 80)", colPos[3] + 5, y + 6, { width: 90 });
      doc.text("Overall Marks\n(Out of 100)", colPos[4] + 5, y + 6, { width: 70 });

      y += hH;
      let totalAccum = 0;

      data.subjects.forEach(st => {
        const pRaw = Number(st.marks.periodicRaw) || 0;
        const p = Math.round(pRaw / 2); // 20 -> 10
        const e = Number(st.marks.enrichment) || 0;
        const t = Number(st.marks.term2) || 0;
        const sum = p + e + t;
        totalAccum += sum;

        doc.rect(tableX, y, tableW, 25).strokeColor(BLUE_BRAND).stroke();
        for (let i = 1; i < colPos.length; i++) {
          doc.moveTo(colPos[i], y).lineTo(colPos[i], y + 25).stroke();
        }

        doc.font("Helvetica-Bold").fontSize(10).fillColor(BLACK).text(st.name, tableX + 5, y + 8);
        doc.font("Helvetica").fontSize(10).text(p.toString(), colPos[1] + 5, y + 8);
        doc.text(e.toString(), colPos[2] + 5, y + 8);
        doc.text(t.toString(), colPos[3] + 5, y + 8);
        doc.text(sum.toString(), colPos[4] + 5, y + 8);
        y += 25;
      });

      y += 35;

      // ─── STATS & ATTENDANCE ────────────────────────────────────────
      const tPoss = data.subjects.length * 100;
      const perc  = tPoss > 0 ? (totalAccum / tPoss) * 100 : 0;
      const grad  = getGrade(perc);

      const drawS = (label: string, value: string, sy: number) => {
        doc.font("Helvetica-Bold").fontSize(10).fillColor(BLUE_BRAND).text(label, MARGIN_X, sy);
        doc.font("Helvetica").fontSize(10).fillColor(BLACK).text(value, MARGIN_X + 115, sy);
        doc.moveTo(MARGIN_X + 110, sy + 14).lineTo(MARGIN_X + 220, sy + 14).strokeColor(BLUE_BRAND).lineWidth(1).stroke();
      };

      drawS("Overall Marks:", `${totalAccum} / ${tPoss}`, y);
      drawS("Overall Percentage:", `${perc.toFixed(2)}%`, y + 25);
      drawS("Overall Grade:", grad, y + 50);

      const aX = 310;
      const aW = PAGE_W - MARGIN_X - aX;
      
      // Attendance Title
      doc.font("Helvetica-Bold").fontSize(10).fillColor(BLUE_BRAND).text("Attendance", aX, y - 15, { width: aW, align: "center" });
      
      const drawA = (label: string, val: string, ry: number) => {
        doc.rect(aX, ry, aW, 22).strokeColor(BLUE_BRAND).stroke();
        doc.moveTo(aX + 145, ry).lineTo(aX + 145, ry + 22).stroke();
        doc.font("Helvetica-Bold").fontSize(9).fillColor(GREEN_ATT).text(label, aX + 5, ry + 6);
        doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK).text(val, aX + 150, ry + 6);
      };

      const attPerc = data.workingDays > 0 ? ((data.attendedDays / data.workingDays) * 100).toFixed(2) + "%" : "0.00%";
      
      drawA("Total Working Days", data.workingDays.toString(), y);
      drawA("Number of Days Attended", data.attendedDays.toString(), y + 22);
      drawA("Attendance Percentage", attPerc, y + 44);

      y += 100;

      // ─── FOOTER (Light Blue Background) ────────────────────────────
      doc.rect(0, y, PAGE_W, doc.page.height - y).fill(BLUE_HEADER);
      
      const bH = 100;
      doc.rect(MARGIN_X, y + 20, PAGE_W - MARGIN_X * 2, bH).fill(WHITE).strokeColor(BLUE_HEADER).stroke();
      doc.font("Helvetica-Bold").fontSize(10).fillColor(BLUE_BRAND).text("Teacher's Remark:", MARGIN_X + 15, y + 35);
      if (data.remarks) {
        doc.font("Helvetica").fontSize(10).fillColor(BLACK).text(data.remarks, MARGIN_X + 15, y + 55, { width: PAGE_W - MARGIN_X * 2 - 30, lineGap: 4 });
      }

      y += bH + 80;

      // Signatures
      const sW = 120;
      doc.strokeColor(BLUE_BRAND).lineWidth(1.2);
      
      // Signature Lines
      doc.moveTo(MARGIN_X, y).lineTo(MARGIN_X + sW, y).stroke();
      doc.moveTo((PAGE_W - sW) / 2, y).lineTo((PAGE_W + sW) / 2, y).stroke();
      doc.moveTo(PAGE_W - MARGIN_X - sW, y).lineTo(PAGE_W - MARGIN_X, y).stroke();

      // Signature Text (Black as per image)
      doc.font("Helvetica").fontSize(10).fillColor(BLACK);
      doc.text("Class Teacher", MARGIN_X, y + 8, { width: sW, align: "center" });
      doc.text("School Stamp", (PAGE_W - sW) / 2, y + 8, { width: sW, align: "center" });
      doc.text("Principal", PAGE_W - MARGIN_X - sW, y + 8, { width: sW, align: "center" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};