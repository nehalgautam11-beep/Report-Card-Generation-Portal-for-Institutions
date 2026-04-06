import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// Define the exact data structures expected
export interface SubjectMarks {
  periodicRaw: number; // Out of 20
  enrichment: number;  // Out of 10
  term2: number;       // Out of 80
}

export interface SubjectEntry {
  name: string;
  marks: SubjectMarks;
}

export interface StudentData {
  name: string;
  fatherName: string;
  motherName: string;
  className: string;
  dob: string;
  workingDays: number;
  attendedDays: number;
  subjects: SubjectEntry[];
  remarks?: string;
}

// Format "JOHN DOE" -> "John Doe"
const toTitleCase = (str: string): string => {
  return (str || "")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Calculate Grades
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

// Main Generator Function
export const generateReportCardPDF = (data: StudentData, logoBuffer?: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // --- COLORS & DIMENSIONS (Exact matches to Image 2) ---
      const BLUE_BRAND  = "#174b8b"; // Deep blue
      const BLUE_BG     = "#f0f5fa"; // Light blue background
      const GREEN_TEXT  = "#3aa853"; // Green for specific attendance labels
      const BLACK       = "#000000";
      const WHITE       = "#ffffff";
      
      const PAGE_W = doc.page.width;
      const PAGE_H = doc.page.height;
      const MARGIN_X = 45;

      // 1. BACKGROUND SECTIONS
      // Top light blue strip
      doc.rect(0, 0, PAGE_W, 100).fill(BLUE_BG);
      // Middle white strip
      doc.rect(0, 100, PAGE_W, PAGE_H - 100).fill(WHITE);

      // 2. HEADER
      // Logo positioning
      if (logoBuffer) {
        try { doc.image(logoBuffer, MARGIN_X, 15, { width: 65 }); } catch(_) {}
      } else {
        const logoPath = path.join(process.cwd(), "public", "gis_logo.png");
        if (fs.existsSync(logoPath)) {
          try { doc.image(logoPath, MARGIN_X, 15, { width: 65 }); } catch(_) {}
        }
      }

      // School Name
      doc.font("Helvetica-Bold").fontSize(22).fillColor(BLUE_BRAND);
      doc.text("GLOBAL INNOVATIVE SCHOOL", 125, 40);

      // Report Card Title (Centered perfectly on the white background)
      doc.font("Helvetica-Bold").fontSize(16).fillColor(BLUE_BRAND);
      doc.text("REPORT CARD", 0, 120, { align: "center", width: PAGE_W });

      // 3. STUDENT DETAILS
      let currentY = 165;
      const col1X = MARGIN_X;
      const col2X = 300;
      const underlineWidth = 155;

      // Helper for detail rows
      const addDetailRow = (label: string, value: string, xPos: number, yPos: number, textOffset: number) => {
        // Label (Blue, Bold)
        doc.font("Helvetica-Bold").fontSize(10).fillColor(BLUE_BRAND).text(label, xPos, yPos);
        // Value (Black, Regular)
        doc.font("Helvetica").fontSize(11).fillColor(BLACK).text(value, xPos + textOffset, yPos - 1);
        // Underline (Thin Blue)
        doc.moveTo(xPos + textOffset - 5, yPos + 12)
           .lineTo(xPos + textOffset + underlineWidth, yPos + 12)
           .strokeColor(BLUE_BRAND).lineWidth(0.8).stroke();
      };

      // Row 1
      addDetailRow("NAME:", toTitleCase(data.name), col1X, currentY, 65);
      addDetailRow("Mother's Name:", toTitleCase(data.motherName), col2X, currentY, 95);
      currentY += 30;
      
      // Row 2 (Class remains uppercase)
      addDetailRow("CLASS:", (data.className || "").toUpperCase(), col1X, currentY, 65);
      addDetailRow("Father's Name:", toTitleCase(data.fatherName), col2X, currentY, 95);
      currentY += 30;

      // Row 3
      addDetailRow("DOB:", data.dob, col1X, currentY, 65);
      currentY += 45;

      // 4. GRADES TABLE
      const tableW = PAGE_W - (MARGIN_X * 2);
      const rowHeight = 35; // Header is taller
      // Exact column widths from the image layout
      const c1 = MARGIN_X;           // Subject (Left align)
      const c2 = c1 + 140;           // Periodic
      const c3 = c2 + 95;            // Enrichment
      const c4 = c3 + 100;           // Term 2
      const c5 = c4 + 90;            // Overall
      
      // Draw Header Box
      doc.rect(c1, currentY, tableW, rowHeight).fill(WHITE).strokeColor(BLUE_BRAND).lineWidth(1).stroke();
      doc.moveTo(c2, currentY).lineTo(c2, currentY + rowHeight).stroke();
      doc.moveTo(c3, currentY).lineTo(c3, currentY + rowHeight).stroke();
      doc.moveTo(c4, currentY).lineTo(c4, currentY + rowHeight).stroke();
      doc.moveTo(c5, currentY).lineTo(c5, currentY + rowHeight).stroke();

      // Header Text
      doc.font("Helvetica-Bold").fontSize(9).fillColor(BLUE_BRAND);
      doc.text("Subject", c1 + 5, currentY + 12);
      // Using line breaks to stack the "out of" text properly
      doc.text("Periodic Test - 2\n(Out of 10)", c2 + 5, currentY + 6, { width: 90 });
      doc.text("Subject Enrichment\n(Out of 10)", c3 + 5, currentY + 6, { width: 95 });
      doc.text("Term - 2 Examination\n(Out of 80)", c4 + 5, currentY + 6, { width: 85 });
      doc.text("Overall Marks\n(Out of 100)", c5 + 5, currentY + 6, { width: 75 });

      currentY += rowHeight;

      let totalAccumulated = 0;
      const dataRowHeight = 25;

      // Draw Data Rows
      data.subjects.forEach(st => {
        const pRaw = Number(st.marks.periodicRaw) || 0;
        const pAdjusted = Math.round(pRaw / 2); // Convert 20 to 10 scale
        const e = Number(st.marks.enrichment) || 0;
        const t = Number(st.marks.term2) || 0;
        const rowTotal = pAdjusted + e + t;
        totalAccumulated += rowTotal;

        // Row Box
        doc.rect(c1, currentY, tableW, dataRowHeight).strokeColor(BLUE_BRAND).lineWidth(1).stroke();
        doc.moveTo(c2, currentY).lineTo(c2, currentY + dataRowHeight).stroke();
        doc.moveTo(c3, currentY).lineTo(c3, currentY + dataRowHeight).stroke();
        doc.moveTo(c4, currentY).lineTo(c4, currentY + dataRowHeight).stroke();
        doc.moveTo(c5, currentY).lineTo(c5, currentY + dataRowHeight).stroke();

        // Row Data (Black text, slightly padded from left edges)
        doc.font("Helvetica-Bold").fontSize(10).fillColor(BLACK).text(st.name, c1 + 5, currentY + 8);
        doc.font("Helvetica").fontSize(10);
        doc.text(pAdjusted.toString(), c2 + 5, currentY + 8);
        doc.text(e.toString(), c3 + 5, currentY + 8);
        doc.text(t.toString(), c4 + 5, currentY + 8);
        doc.text(rowTotal.toString(), c5 + 5, currentY + 8);
        
        currentY += dataRowHeight;
      });

      currentY += 40; // Space below table

      // 5. STATS & ATTENDANCE
      const totalPossible = data.subjects.length * 100;
      const finalPercentage = totalPossible > 0 ? (totalAccumulated / totalPossible) * 100 : 0;
      const finalGrade = getGrade(finalPercentage);

      // Left Column: Stats
      const statX = MARGIN_X;
      
      const addStatRow = (label: string, value: string, yPos: number) => {
        doc.font("Helvetica-Bold").fontSize(10).fillColor(BLUE_BRAND).text(label, statX, yPos);
        doc.font("Helvetica").fontSize(10).fillColor(BLACK).text(value, statX + 110, yPos);
        doc.moveTo(statX + 105, yPos + 12).lineTo(statX + 225, yPos + 12).strokeColor(BLUE_BRAND).lineWidth(1).stroke();
      };

      addStatRow("Overall Marks:", `${totalAccumulated} / ${totalPossible}`, currentY);
      addStatRow("Overall Percentage:", `${finalPercentage.toFixed(2)}%`, currentY + 28);
      addStatRow("Overall Grade:", finalGrade, currentY + 56);

      // Right Column: Attendance Box
      // Aligned with the right edge of the main table
      const attWidth = 200;
      const attX = (MARGIN_X + tableW) - attWidth; 
      
      // Attendance Title (Centered over the box)
      doc.font("Helvetica-Bold").fontSize(10).fillColor(BLUE_BRAND).text("Attendance", attX, currentY - 15, { width: attWidth, align: "center" });

      const attRowHeight = 22;
      const attSplitX = attX + 140; // Where the vertical line goes

      const addAttRow = (label: string, value: string, yPos: number) => {
        doc.rect(attX, yPos, attWidth, attRowHeight).strokeColor(BLUE_BRAND).lineWidth(1).stroke();
        doc.moveTo(attSplitX, yPos).lineTo(attSplitX, yPos + attRowHeight).stroke();
        
        // Green labels for attendance
        doc.font("Helvetica-Bold").fontSize(9).fillColor(GREEN_TEXT).text(label, attX + 5, yPos + 6);
        // Black bold values
        doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK).text(value, attSplitX + 5, yPos + 6);
      };

      const attendancePercValue = data.workingDays > 0 ? ((data.attendedDays / data.workingDays) * 100).toFixed(2) + "%" : "0.00%";

      addAttRow("Total Working Days", data.workingDays.toString(), currentY);
      addAttRow("Number of Days Attended", data.attendedDays.toString(), currentY + attRowHeight);
      addAttRow("Attendance Percentage", attendancePercValue, currentY + (attRowHeight * 2));

      currentY += 90;

      // 6. FOOTER & REMARKS
      // Bottom light blue background extending to bottom of page
      doc.rect(0, currentY, PAGE_W, PAGE_H - currentY).fill(BLUE_BG);

      // White Remarks Box (No borders)
      const remarkBoxHeight = 90;
      currentY += 25; // padding top
      doc.rect(MARGIN_X, currentY, tableW, remarkBoxHeight).fill(WHITE);
      
      doc.font("Helvetica-Bold").fontSize(10).fillColor(BLUE_BRAND).text("Teacher's Remark:", MARGIN_X + 15, currentY + 15);
      
      if (data.remarks) {
        doc.font("Helvetica").fontSize(10).fillColor(BLACK).text(data.remarks, MARGIN_X + 15, currentY + 35, { 
          width: tableW - 30, 
          lineGap: 4 
        });
      }

      currentY += remarkBoxHeight + 80;

      // 7. SIGNATURES
      const sigWidth = 110;
      doc.strokeColor(BLUE_BRAND).lineWidth(1.2);
      
      // Lines
      doc.moveTo(MARGIN_X, currentY).lineTo(MARGIN_X + sigWidth, currentY).stroke(); // Left
      doc.moveTo((PAGE_W - sigWidth) / 2, currentY).lineTo((PAGE_W + sigWidth) / 2, currentY).stroke(); // Center
      doc.moveTo(PAGE_W - MARGIN_X - sigWidth, currentY).lineTo(PAGE_W - MARGIN_X, currentY).stroke(); // Right

      // Text underneath lines (Black)
      doc.font("Helvetica").fontSize(10).fillColor(BLACK);
      doc.text("Class Teacher", MARGIN_X, currentY + 8, { width: sigWidth, align: "center" });
      doc.text("School Stamp", (PAGE_W - sigWidth) / 2, currentY + 8, { width: sigWidth, align: "center" });
      doc.text("Principal", PAGE_W - MARGIN_X - sigWidth, currentY + 8, { width: sigWidth, align: "center" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};