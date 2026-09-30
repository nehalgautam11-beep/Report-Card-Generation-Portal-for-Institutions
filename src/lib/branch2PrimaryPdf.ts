import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export interface SubjectMarks {
  periodicRaw?: number;
  enrichment?: number;
  term2?: number;
  quarterly50?: number;
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

const getGradeFor50 = (marks: number): string => {
  const percentage = (marks / 50) * 100;
  if (percentage >= 91) return "A1";
  if (percentage >= 81) return "A2";
  if (percentage >= 71) return "B1";
  if (percentage >= 61) return "B2";
  if (percentage >= 51) return "C1";
  if (percentage >= 41) return "C2";
  if (percentage >= 33) return "D";
  return "E";
};

const getGradeForPercentage = (percentage: number): string => {
  if (percentage >= 91) return "A1";
  if (percentage >= 81) return "A2";
  if (percentage >= 71) return "B1";
  if (percentage >= 61) return "B2";
  if (percentage >= 51) return "C1";
  if (percentage >= 41) return "C2";
  if (percentage >= 33) return "D";
  return "E";
};

export const generateBranch2ReportCardPDF = (data: StudentData, logoBuffer?: Buffer): Promise<Buffer> => {
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

      // 1. BACKGROUNDS
      doc.rect(0, 0, PAGE_W, 130).fill(BG_BLUE);
      doc.rect(0, 130, PAGE_W, PAGE_H - 130).fill(WHITE);

      // 2. HEADER LOGO & TEXT (Without Branch 1 address)
      if (logoBuffer) {
        try { doc.image(logoBuffer, MARGIN_X, 24, { width: 85 }); } catch (_) { }
      } else {
        const logoPath = path.join(process.cwd(), "public", "gis_logo.png");
        if (fs.existsSync(logoPath)) {
          try { doc.image(logoPath, MARGIN_X, 24, { width: 85 }); } catch (_) { }
        }
      }

      doc.font("Helvetica-Bold").fontSize(24).fillColor(TEXT_BLUE);
      doc.text("GLOBAL INNOVATIVE SCHOOL", 145, 38);

      doc.font("Helvetica").fontSize(13).fillColor(TEXT_BLUE);
      doc.text("Innovate to lead", 148, 68);

      // 3. TITLE
      doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT_BLUE);
      doc.text("REPORT CARD", 0, 142, { align: "center", width: PAGE_W });

      // 4. STUDENT DETAILS
      let curY = 182;
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

      // 5. GRADES TABLE (Branch 2: 3 Columns)
      // Columns: Subject | Quarterly Examination (Out of 50) | Grade
      const tableW = PAGE_W - (MARGIN_X * 2);
      const rowH = 38;
      
      const c1 = MARGIN_X;
      const c2 = c1 + 220;
      const c3 = c2 + 160;

      doc.rect(c1, curY, tableW, rowH).fill(WHITE);
      doc.lineWidth(1).strokeColor(BORDER_BLUE);
      doc.rect(c1, curY, tableW, rowH).stroke();
      
      doc.moveTo(c2, curY).lineTo(c2, curY + rowH).stroke();
      doc.moveTo(c3, curY).lineTo(c3, curY + rowH).stroke();

      // Header Text
      doc.font("Helvetica-Bold").fontSize(12).fillColor(BLACK);
      doc.text("Subject", c1 + 10, curY + 13);
      doc.text("Quarterly Examination\n(Out of 50)", c2 + 10, curY + 6, { width: 140, align: "center" });
      doc.text("Grade", c3 + 10, curY + 13, { width: tableW - (c3 - c1) - 20, align: "center" }); 

      curY += rowH;

      let totalAccumulated = 0;
      let totalPossible = 0;
      const dataRowH = 30;

      data.subjects.forEach(st => {
        const isGradeOnlySubject = st.excludeFromTotals || Boolean(st.manualGrade);
        const qMarks = Number(st.marks.quarterly50 ?? st.marks.term2 ?? st.marks.periodicRaw ?? 0);
        const rowGrade = isGradeOnlySubject
          ? (st.manualGrade || "-")
          : getGradeFor50(qMarks);

        if (!isGradeOnlySubject) {
          totalAccumulated += qMarks;
          totalPossible += 50;
        }

        doc.rect(c1, curY, tableW, dataRowH).strokeColor(BORDER_BLUE).stroke();
        doc.moveTo(c2, curY).lineTo(c2, curY + dataRowH).stroke();
        doc.moveTo(c3, curY).lineTo(c3, curY + dataRowH).stroke();

        doc.font("Helvetica-Bold").fontSize(12).fillColor(BLACK).text(st.name, c1 + 10, curY + 9);

        doc.font("Helvetica").fontSize(12);
        if (isGradeOnlySubject) {
          doc.text("-", c2 + 10, curY + 9, { width: 140, align: "center" });
          doc.text(rowGrade, c3 + 10, curY + 9, { width: tableW - (c3 - c1) - 20, align: "center" });
        } else {
          doc.text(qMarks.toString(), c2 + 10, curY + 9, { width: 140, align: "center" });
          doc.text(rowGrade, c3 + 10, curY + 9, { width: tableW - (c3 - c1) - 20, align: "center" });
        }
        curY += dataRowH;
      });

      curY += 25;

      // 6. STATS & ATTENDANCE (Without Promoted Class)
      const finalPercentage = totalPossible > 0 ? (totalAccumulated / totalPossible) * 100 : 0;
      const finalGrade = getGradeForPercentage(finalPercentage);

      const statX = MARGIN_X;
      const drawStat = (label: string, value: string, yPos: number) => {
        doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text(label, statX, yPos);
        if (totalPossible > 0) {
          doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text(value, statX + 130, yPos);
        }
        doc.moveTo(statX + 120, yPos + 13).lineTo(statX + 235, yPos + 13).strokeColor(BORDER_BLUE).stroke();
      };

      drawStat("Overall Marks:", `${totalAccumulated} / ${totalPossible}`, curY);
      drawStat("Overall Percentage:", `${finalPercentage.toFixed(2)}%`, curY + 25);
      drawStat("Overall Grade:", finalGrade, curY + 50);

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
      curY += remarkBoxHeight + 80;

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
