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

export const generateReportCardPDF = (data: StudentData, logoBuffer?: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // ─── EXACT COLORS EXTRACTED FROM NEW IMAGE ───────────────────────
      const BG_BLUE       = "#e6f0fa"; // Header and Footer background
      const TEXT_BLUE     = "#1c5792"; // Main brand text
      const TEXT_LT_BLUE  = "#4a85c5"; // Signature labels
      const BORDER_BLUE   = "#8ebce6"; // Table borders and input lines
      const TEXT_GREEN    = "#449944"; // Attendance labels
      const BLACK         = "#000000";
      const WHITE         = "#ffffff";
      
      const PAGE_W = doc.page.width;
      const PAGE_H = doc.page.height;
      const MARGIN_X = 50;

      // 1. BACKGROUNDS
      doc.rect(0, 0, PAGE_W, 115).fill(BG_BLUE); // Top header
      doc.rect(0, 115, PAGE_W, PAGE_H - 115).fill(WHITE); // Main body

      // 2. HEADER LOGO & TEXT
      if (logoBuffer) {
        try { doc.image(logoBuffer, MARGIN_X - 5, 18, { width: 80 }); } catch(_) {}
      } else {
        const logoPath = path.join(process.cwd(), "public", "gis_logo.png");
        if (fs.existsSync(logoPath)) {
          try { doc.image(logoPath, MARGIN_X - 5, 18, { width: 80 }); } catch(_) {}
        }
      }

      doc.font("Helvetica-Bold").fontSize(26).fillColor(TEXT_BLUE);
      doc.text("GLOBAL INNOVATIVE SCHOOL", 140, 45);

      // 3. TITLE
      doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT_BLUE);
      doc.text("REPORT CARD", 0, 135, { align: "center", width: PAGE_W });

      // 4. STUDENT DETAILS (With exact colon alignment)
      let curY = 185;
      const col1X = MARGIN_X;
      const colonX = MARGIN_X + 55; // Fixed vertical line for colons
      const input1X = colonX + 10;
      const col2X = 310;
      const input2X = col2X + 85;

      const drawAlignedDetail = (label: string, value: string, yPos: number) => {
        doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text(label, col1X, yPos);
        doc.text(":", colonX, yPos);
        doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text(value, input1X + 5, yPos);
        doc.moveTo(input1X, yPos + 12).lineTo(280, yPos + 12).strokeColor(BORDER_BLUE).lineWidth(1).stroke();
      };

      const drawRightDetail = (label: string, value: string, yPos: number) => {
        doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text(label, col2X, yPos);
        doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text(value, input2X + 5, yPos);
        doc.moveTo(input2X, yPos + 12).lineTo(PAGE_W - MARGIN_X, yPos + 12).strokeColor(BORDER_BLUE).lineWidth(1).stroke();
      };

      drawAlignedDetail("NAME", toTitleCase(data.name), curY);
      drawRightDetail("Mother's Name:", toTitleCase(data.motherName), curY);
      curY += 35;
      
      drawAlignedDetail("CLASS", (data.className || "").toUpperCase(), curY);
      drawRightDetail("Father's Name:", toTitleCase(data.fatherName), curY);
      curY += 35;

      drawAlignedDetail("DOB", data.dob, curY);
      curY += 50;

      // 5. GRADES TABLE (Light blue borders, black text)
      const tableW = PAGE_W - (MARGIN_X * 2);
      const rowH = 45; 
      const c1 = MARGIN_X;
      const c2 = c1 + 95;
      const c3 = c2 + 95;
      const c4 = c3 + 95;
      const c5 = c4 + 95;
      
      // Header Box
      doc.rect(c1, curY, tableW, rowH).fill(WHITE).strokeColor(BORDER_BLUE).lineWidth(1).stroke();
      doc.moveTo(c2, curY).lineTo(c2, curY + rowH).stroke();
      doc.moveTo(c3, curY).lineTo(c3, curY + rowH).stroke();
      doc.moveTo(c4, curY).lineTo(c4, curY + rowH).stroke();
      doc.moveTo(c5, curY).lineTo(c5, curY + rowH).stroke();

      // Header Text (Black as per image 3)
      doc.font("Helvetica-Bold").fontSize(10).fillColor(BLACK);
      doc.text("Subject", c1 + 5, curY + 18);
      doc.text("Periodic Test - 2\n(Out of 10)", c2 + 5, curY + 12, { width: 90 });
      doc.text("Subject\nEnrichment (Out\nof 10)", c3 + 5, curY + 6, { width: 90 });
      doc.text("Term - 2\nExamination\n(Out of 80)", c4 + 5, curY + 6, { width: 90 });
      doc.text("Overall Marks\n(Out of 100)", c5 + 5, curY + 12, { width: 90 });

      curY += rowH;

      let totalAccumulated = 0;
      const dataRowH = 28;

      data.subjects.forEach(st => {
        const pRaw = Number(st.marks.periodicRaw) || 0;
        const p = Math.round(pRaw / 2);
        const e = Number(st.marks.enrichment) || 0;
        const t = Number(st.marks.term2) || 0;
        const sum = p + e + t;
        totalAccumulated += sum;

        doc.rect(c1, curY, tableW, dataRowH).strokeColor(BORDER_BLUE).stroke();
        doc.moveTo(c2, curY).lineTo(c2, curY + dataRowH).stroke();
        doc.moveTo(c3, curY).lineTo(c3, curY + dataRowH).stroke();
        doc.moveTo(c4, curY).lineTo(c4, curY + dataRowH).stroke();
        doc.moveTo(c5, curY).lineTo(c5, curY + dataRowH).stroke();

        doc.font("Helvetica-Bold").fontSize(11).fillColor(BLACK).text(st.name, c1 + 5, curY + 10);
        
        // Only print numbers if they are > 0 or if you want to force zeros, adjust logic here
        doc.font("Helvetica").fontSize(11);
        if (pRaw !== 0 || e !== 0 || t !== 0) {
          doc.text(p.toString(), c2 + 5, curY + 10);
          doc.text(e.toString(), c3 + 5, curY + 10);
          doc.text(t.toString(), c4 + 5, curY + 10);
          doc.text(sum.toString(), c5 + 5, curY + 10);
        }
        curY += dataRowH;
      });

      curY += 35;

      // 6. STATS & ATTENDANCE
      const totalPossible = data.subjects.length * 100;
      const finalPercentage = totalPossible > 0 ? (totalAccumulated / totalPossible) * 100 : 0;
      const finalGrade = getGrade(finalPercentage);

      const statX = MARGIN_X;
      
      const drawStat = (label: string, value: string, yPos: number) => {
        doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text(label, statX, yPos);
        if (totalAccumulated > 0) {
          doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text(value, statX + 140, yPos);
        }
        doc.moveTo(statX + 130, yPos + 12).lineTo(statX + 245, yPos + 12).strokeColor(BORDER_BLUE).stroke();
      };

      drawStat("Overall Marks:", `${totalAccumulated} / ${totalPossible}`, curY);
      drawStat("Overall Percentage:", `${finalPercentage.toFixed(2)}%`, curY + 30);
      drawStat("Overall Grade:", finalGrade, curY + 60);

      const attW = 240;
      const attX = PAGE_W - MARGIN_X - attW; 
      
      doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text("Attendance", attX, curY + 15, { width: attW, align: "center" });

      const attRowH = 22;
      const attSplitX = attX + 120; 
      let attY = curY + 30;

      const drawAttRow = (label: string, value: string, yPos: number) => {
        doc.rect(attX, yPos, attW, attRowH).strokeColor(BORDER_BLUE).stroke();
        doc.moveTo(attSplitX, yPos).lineTo(attSplitX, yPos + attRowH).stroke();
        doc.font("Helvetica").fontSize(9).fillColor(TEXT_GREEN).text(label, attX + 5, yPos + 6);
        doc.font("Helvetica-Bold").fontSize(10).fillColor(BLACK).text(value, attSplitX + 5, yPos + 6);
      };

      // Only 2 rows as per template
      drawAttRow("Total Working Days", data.workingDays > 0 ? data.workingDays.toString() : "", attY);
      drawAttRow("Number of Days Attended", data.attendedDays > 0 ? data.attendedDays.toString() : "", attY + attRowH);

      curY += 120;

      // 7. FOOTER & REMARKS
      // Bottom light blue background extending to bottom of page
      doc.rect(0, curY, PAGE_W, PAGE_H - curY).fill(BG_BLUE);

      // White Remarks Box
      const remarkBoxHeight = 120;
      curY += 25; 
      doc.rect(MARGIN_X, curY, tableW, remarkBoxHeight).fill(WHITE);
      
      doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT_BLUE).text("Teacher's Remark:", MARGIN_X + 15, curY + 15);
      
      if (data.remarks) {
        doc.font("Helvetica").fontSize(11).fillColor(TEXT_BLUE).text(data.remarks, MARGIN_X + 15, curY + 40, { 
          width: tableW - 30, 
          lineGap: 4 
        });
      }

      curY += remarkBoxHeight + 80;

      // 8. SIGNATURES
      const sigW = 140;
      doc.strokeColor(TEXT_BLUE).lineWidth(1);
      
      doc.moveTo(MARGIN_X, curY).lineTo(MARGIN_X + sigW, curY).stroke(); 
      doc.moveTo((PAGE_W - sigW) / 2, curY).lineTo((PAGE_W + sigW) / 2, curY).stroke(); 
      doc.moveTo(PAGE_W - MARGIN_X - sigW, curY).lineTo(PAGE_W - MARGIN_X, curY).stroke(); 

      // Text underneath lines (Light Blue as per Image 3)
      doc.font("Helvetica").fontSize(12).fillColor(TEXT_LT_BLUE);
      doc.text("Class Teacher", MARGIN_X, curY + 10, { width: sigW, align: "center" });
      doc.text("School Stamp", (PAGE_W - sigW) / 2, curY + 10, { width: sigW, align: "center" });
      doc.text("Principal", PAGE_W - MARGIN_X - sigW, curY + 10, { width: sigW, align: "center" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};