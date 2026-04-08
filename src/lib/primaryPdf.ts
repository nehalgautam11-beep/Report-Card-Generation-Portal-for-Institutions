import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export interface SubjectMarks {
  periodicRaw: number;
  enrichment: number;
  term2: number;
}

export interface SubjectEntry {
  name: string;
  marks: SubjectMarks;
  manualGrade?: string;
  excludeFromTotals?: boolean;
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

const toTitleCase = (str: string): string => {
  return (str || "")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

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

// Logic to determine the next class based on the current class
const getPromotedClass = (currentClass: string): string => {
  const cls = (currentClass || "").toLowerCase().trim();
  if (cls === 'Kg 1' || cls === 'junior kg' || cls === 'jkg') return 'Senior KG';
  if (cls === 'Kg 2' || cls === 'senior kg' || cls === 'skg') return '1st';
  if (cls === '1st' || cls === '1') return '2nd';
  if (cls === '2nd' || cls === '2') return '3rd';
  if (cls === '3rd' || cls === '3') return '4th';
  if (cls === '4th' || cls === '4') return '5th';
  if (cls === '5th' || cls === '5') return '6th';
  if (cls === '6th' || cls === '6') return '7th';
  if (cls === '7th' || cls === '7') return '8th';
  if (cls === '8th' || cls === '8') return '9th';
  if (cls === '9th' || cls === '9') return '10th';
  return '';
};

export const generateReportCardPDF = (data: StudentData, logoBuffer?: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // ─── COLORS ─────────────────────────────────────────────────────────
      const BG_BLUE = "#e6f0fa";
      const TEXT_BLUE = "#1c5792";
      const TEXT_LT_BLUE = "#4a85c5";
      const BORDER_BLUE = "#8ebce6";
      const TEXT_GREEN = "#449944";
      const BLACK = "#000000";
      const WHITE = "#ffffff";

      const PAGE_W = doc.page.width;
      const PAGE_H = doc.page.height;
      const MARGIN_X = 45;

      // 1. BACKGROUNDS (Extended height to fit address)
      doc.rect(0, 0, PAGE_W, 145).fill(BG_BLUE);
      doc.rect(0, 145, PAGE_W, PAGE_H - 145).fill(WHITE);

      // 2. HEADER LOGO & TEXT 
      if (logoBuffer) {
        try { doc.image(logoBuffer, MARGIN_X, 28, { width: 85 }); } catch (_) { }
      } else {
        const logoPath = path.join(process.cwd(), "public", "gis_logo.png");
        if (fs.existsSync(logoPath)) {
          try { doc.image(logoPath, MARGIN_X, 28, { width: 85 }); } catch (_) { }
        }
      }

      doc.font("Helvetica-Bold").fontSize(24).fillColor(TEXT_BLUE);
      doc.text("GLOBAL INNOVATIVE SCHOOL", 145, 42);

      doc.font("Helvetica").fontSize(13).fillColor(TEXT_BLUE);
      doc.text("Innovate to lead", 148, 72);

      // --- ADDED ADDRESS HERE ---
      doc.font("Helvetica").fontSize(10).fillColor(TEXT_BLUE);
      doc.text("1320, 1321, Sch no. 114, Part 1, Vijay Nagar, Indore, 452010", 148, 92);

      // 3. TITLE (Moved down slightly to accommodate header)
      doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT_BLUE);
      doc.text("REPORT CARD", 0, 155, { align: "center", width: PAGE_W });

      // 4. STUDENT DETAILS
      let curY = 195;
      const col1X = MARGIN_X;
      const colonX = MARGIN_X + 65; 
      const input1X = colonX + 10;
      const col2X = 295;
      const input2X = col2X + 100; 

      const drawAlignedDetail = (label: string, value: string, yPos: number) => {
        doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT_BLUE).text(label, col1X, yPos);
        doc.text(":", colonX, yPos);
        doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT_BLUE).text(value, input1X + 5, yPos - 1);
        doc.moveTo(input1X, yPos + 13).lineTo(280, yPos + 13).strokeColor(BORDER_BLUE).lineWidth(1).stroke();
      };

      const drawRightDetail = (label: string, value: string, yPos: number) => {
        doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT_BLUE).text(label, col2X, yPos);
        doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT_BLUE).text(value, input2X + 5, yPos - 1);
        doc.moveTo(input2X, yPos + 13).lineTo(PAGE_W - MARGIN_X, yPos + 13).strokeColor(BORDER_BLUE).lineWidth(1).stroke();
      };

      // Row 1
      drawAlignedDetail("Name", toTitleCase(data.name), curY);
      drawRightDetail("Mother's Name:", toTitleCase(data.motherName), curY);
      curY += 32;

      // Row 2
      drawAlignedDetail("Class", toTitleCase(data.className), curY);
      drawRightDetail("Father's Name:", toTitleCase(data.fatherName), curY);
      curY += 32;

      // Row 3
      drawAlignedDetail("DOB", data.dob, curY);
      drawRightDetail("Academic Year:", "2025-26", curY);
      curY += 45;

      // 5. GRADES TABLE (Recalibrated for 6 Columns)
      const tableW = PAGE_W - (MARGIN_X * 2);
      const rowH = 48; // Taller header to fit tight text breaks
      
      const c1 = MARGIN_X;
      const c2 = c1 + 100;
      const c3 = c2 + 80;
      const c4 = c3 + 80;
      const c5 = c4 + 80;
      const c6 = c5 + 80; // The new 6th column

      doc.rect(c1, curY, tableW, rowH).fill(WHITE);
      doc.lineWidth(1).strokeColor(BORDER_BLUE);
      doc.rect(c1, curY, tableW, rowH).stroke();
      
      doc.moveTo(c2, curY).lineTo(c2, curY + rowH).stroke();
      doc.moveTo(c3, curY).lineTo(c3, curY + rowH).stroke();
      doc.moveTo(c4, curY).lineTo(c4, curY + rowH).stroke();
      doc.moveTo(c5, curY).lineTo(c5, curY + rowH).stroke();
      doc.moveTo(c6, curY).lineTo(c6, curY + rowH).stroke(); // Line for new column

      // Header Text
      doc.font("Helvetica-Bold").fontSize(12).fillColor(BLACK);
      doc.text("Subject", c1 + 5, curY + 18);

      doc.font("Helvetica-Bold").fontSize(10);
      doc.text("Periodic Test - 2\n(Out of 10)", c2 + 5, curY + 8, { width: 70 });
      doc.text("Subject\nEnrichment\n(Out of 10)", c3 + 5, curY + 4, { width: 70 });
      doc.text("Term - 2\nExamination\n(Out of 80)", c4 + 5, curY + 4, { width: 70 });
      doc.text("Overall Marks\n(Out of 100)", c5 + 5, curY + 8, { width: 70 });
      
      // --- ADDED NEW COLUMN HEADER ---
      doc.text("Grade", c6 + 5, curY + 18, { width: 75 }); 

      curY += rowH;

      let totalAccumulated = 0;
      const dataRowH = 30;

      data.subjects.forEach(st => {
        const isGradeOnlySubject = st.excludeFromTotals || Boolean(st.manualGrade);
        const pRaw = Number(st.marks.periodicRaw) || 0;
        const p = Math.round(pRaw / 2);
        const e = Number(st.marks.enrichment) || 0;
        const t = Number(st.marks.term2) || 0;
        const sum = p + e + t;
        const rowGrade = isGradeOnlySubject
          ? (st.manualGrade || "-")
          : getGrade(sum);

        if (!isGradeOnlySubject) {
          totalAccumulated += sum;
        }

        doc.rect(c1, curY, tableW, dataRowH).strokeColor(BORDER_BLUE).stroke();
        doc.moveTo(c2, curY).lineTo(c2, curY + dataRowH).stroke();
        doc.moveTo(c3, curY).lineTo(c3, curY + dataRowH).stroke();
        doc.moveTo(c4, curY).lineTo(c4, curY + dataRowH).stroke();
        doc.moveTo(c5, curY).lineTo(c5, curY + dataRowH).stroke();
        doc.moveTo(c6, curY).lineTo(c6, curY + dataRowH).stroke(); // Data line for new column

        doc.font("Helvetica-Bold").fontSize(12).fillColor(BLACK).text(st.name, c1 + 5, curY + 10);

        doc.font("Helvetica").fontSize(12);
        if (isGradeOnlySubject) {
          doc.text("-", c2 + 5, curY + 10);
          doc.text("-", c3 + 5, curY + 10);
          doc.text("-", c4 + 5, curY + 10);
          doc.text("-", c5 + 5, curY + 10);
          doc.text(rowGrade, c6 + 5, curY + 10);
        } else if (pRaw !== 0 || e !== 0 || t !== 0) {
          doc.text(p.toString(), c2 + 5, curY + 10);
          doc.text(e.toString(), c3 + 5, curY + 10);
          doc.text(t.toString(), c4 + 5, curY + 10);
          doc.text(sum.toString(), c5 + 5, curY + 10);
          doc.text(rowGrade, c6 + 5, curY + 10);
        }
        curY += dataRowH;
      });

      curY += 20;

      // 6. STATS & ATTENDANCE 
      const totalPossible = data.subjects.reduce(
        (sum, subject) => sum + (subject.excludeFromTotals ? 0 : 100),
        0
      );
      const finalPercentage = totalPossible > 0 ? (totalAccumulated / totalPossible) * 100 : 0;
      const finalGrade = getGrade(finalPercentage);
      const nextClass = getPromotedClass(data.className);

      const statX = MARGIN_X;
      const drawStat = (label: string, value: string, yPos: number) => {
        doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text(label, statX, yPos);
        if (totalPossible > 0 || label === "Promoted to:") {
          doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text(value, statX + 130, yPos);
        }
        doc.moveTo(statX + 120, yPos + 13).lineTo(statX + 235, yPos + 13).strokeColor(BORDER_BLUE).stroke();
      };

      drawStat("Overall Marks:", `${totalAccumulated} / ${totalPossible}`, curY);
      drawStat("Overall Percentage:", `${finalPercentage.toFixed(2)}%`, curY + 25);
      drawStat("Overall Grade:", finalGrade, curY + 50);

      if (nextClass) {
        drawStat("Promoted to:", nextClass, curY + 75);
      }

      const attW = 230;
      const attX = PAGE_W - MARGIN_X - attW;

      doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text("Attendance", attX, curY - 5, { width: attW, align: "center" });

      const attRowH = 20;
      const attSplitX = attX + 130;
      let attY = curY + 10;

      const drawAttRow = (label: string, value: string, yPos: number) => {
        doc.rect(attX, yPos, attW, attRowH).strokeColor(BORDER_BLUE).stroke();
        doc.moveTo(attSplitX, yPos).lineTo(attSplitX, yPos + attRowH).stroke();
        doc.font("Helvetica").fontSize(9).fillColor(TEXT_GREEN).text(label, attX + 5, yPos + 6);
        doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK).text(value, attSplitX + 5, yPos + 6);
      };

      const attPercValue = data.workingDays > 0 ? ((data.attendedDays / data.workingDays) * 100).toFixed(2) + "%" : "0.00%";

      drawAttRow("Total Working Days", data.workingDays > 0 ? data.workingDays.toString() : "", attY);
      drawAttRow("Number of Days Attended", data.attendedDays > 0 ? data.attendedDays.toString() : "", attY + attRowH);
      drawAttRow("Attendance Percentage", attPercValue, attY + (attRowH * 2));

      curY += 95;

      // 7. FOOTER & REMARKS
      const footerStartY = curY;
      doc.rect(0, footerStartY, PAGE_W, PAGE_H - footerStartY).fill(BG_BLUE);

      const remarkBoxHeight = 90;
      curY += 15;
      doc.rect(MARGIN_X, curY, tableW, remarkBoxHeight).fill(WHITE);

      doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text("Teacher's Remark:", MARGIN_X + 15, curY + 12);

      if (data.remarks) {
        doc.font("Helvetica").fontSize(12).fillColor(TEXT_BLUE).text(data.remarks, MARGIN_X + 15, curY + 30, {
          width: tableW - 30,
          lineGap: 4
        });
      }

      // 8. SIGNATURES & STAMP SPACE
      curY += remarkBoxHeight + 80; // Spacing adjusted to ensure everything stays on one page

      const sigW = 120;
      doc.strokeColor(TEXT_BLUE).lineWidth(1);

      doc.moveTo(MARGIN_X, curY).lineTo(MARGIN_X + sigW, curY).stroke();
      doc.moveTo((PAGE_W - sigW) / 2, curY).lineTo((PAGE_W + sigW) / 2, curY).stroke();
      doc.moveTo(PAGE_W - MARGIN_X - sigW, curY).lineTo(PAGE_W - MARGIN_X, curY).stroke();

      doc.font("Helvetica").fontSize(11).fillColor(TEXT_LT_BLUE);
      doc.text("Class Teacher", MARGIN_X, curY + 10, { width: sigW, align: "center" });
      doc.text("School Stamp", (PAGE_W - sigW) / 2, curY + 10, { width: sigW, align: "center" });
      doc.text("Principal", PAGE_W - MARGIN_X - sigW, curY + 10, { width: sigW, align: "center" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};
