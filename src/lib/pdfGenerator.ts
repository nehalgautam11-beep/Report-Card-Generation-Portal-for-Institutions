import PDFDocument from "pdfkit";

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
  periodicRaw: number;
  enrichment: number;
  term2: number;
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

const toTitleCase = (str: string): string => {
  return (str || "")
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

export const generateReportCardPDF = (data: StudentData, logoBuffer?: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0 });
      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const BLUE = "#1f4e79";
      const LIGHT = "#eef5fb";
      const BORDER = "#b0c4de";
      const GREEN = "#2e7d32";
      const BLACK = "#000";
      const PAGE_W = doc.page.width;
      const M = 50;

      // HEADER
      doc.rect(0, 0, PAGE_W, 90).fill(LIGHT);

      if (logoBuffer) {
        doc.image(logoBuffer, M, 15, { width: 60 });
      }

      doc.font("Helvetica-Bold")
        .fontSize(24)
        .fillColor(BLUE)
        .text("GLOBAL INNOVATIVE SCHOOL", 140, 35);

      doc.font("Helvetica-Bold")
        .fontSize(18)
        .fillColor(BLUE)
        .text("REPORT CARD", 0, 110, { align: "center" });

      // DETAILS
      let y = 150;

      const draw = (label: string, value: string, x: number, colonX: number) => {
        doc.font("Helvetica-Bold").fontSize(11).fillColor(BLUE).text(label, x, y);
        doc.text(":", x + colonX, y);

        doc.font("Helvetica")
          .fontSize(13)
          .fillColor(BLACK)
          .text(toTitleCase(value), x + colonX + 10, y);

        doc.moveTo(x + colonX + 10, y + 15)
          .lineTo(x + colonX + 190, y + 15)
          .strokeColor(BORDER)
          .stroke();
      };

      draw("NAME", data.name, M, 70);
      draw("Mother's Name", data.motherName, 320, 110);

      y += 30;
      draw("CLASS", data.className, M, 70);
      draw("Father's Name", data.fatherName, 320, 110);

      y += 30;
      draw("DOB", data.dob, M, 70);

      y += 50;

      // TABLE
      const tableX = M;
      const col = [0, 120, 240, 360, 470].map(v => v + tableX);
      const rowH = 32;

      doc.rect(tableX, y, PAGE_W - 2 * M, 40).strokeColor(BLUE).stroke();

      const headers = [
        "Subject",
        "Periodic Test - 2\n(Out of 10)",
        "Subject Enrichment\n(Out of 10)",
        "Term - 2 Examination\n(Out of 80)",
        "Overall Marks\n(Out of 100)"
      ];

      headers.forEach((h, i) => {
        doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK)
          .text(h, col[i] + 5, y + 10, { width: 100 });

        if (i > 0) {
          doc.moveTo(col[i], y).lineTo(col[i], y + 40).stroke();
        }
      });

      y += 40;
      let total = 0;

      data.subjects.forEach(s => {
        const p = Math.round((Number(s.marks.periodicRaw) || 0) / 2);
        const e = Number(s.marks.enrichment) || 0;
        const t = Number(s.marks.term2) || 0;
        const sum = p + e + t;
        total += sum;

        doc.rect(tableX, y, PAGE_W - 2 * M, rowH).stroke();

        col.forEach((c, i) => {
          if (i > 0) doc.moveTo(c, y).lineTo(c, y + rowH).stroke();
        });

        doc.font("Helvetica-Bold").fontSize(11).text(s.name, col[0] + 8, y + 10);
        doc.font("Helvetica").fontSize(11);
        doc.text(p.toString(), col[1] + 8, y + 10);
        doc.text(e.toString(), col[2] + 8, y + 10);
        doc.text(t.toString(), col[3] + 8, y + 10);
        doc.text(sum.toString(), col[4] + 8, y + 10);

        y += rowH;
      });

      y += 30;

      const totalMax = data.subjects.length * 100;
      const percent = (total / totalMax) * 100;
      const grade = getGrade(percent);

      const stat = (label: string, val: string, yy: number) => {
        doc.font("Helvetica-Bold").fontSize(12).fillColor(BLUE).text(label, M, yy);
        doc.font("Helvetica").fillColor(BLACK).text(val, M + 150, yy);

        doc.moveTo(M + 145, yy + 15)
          .lineTo(M + 280, yy + 15)
          .strokeColor(BORDER)
          .stroke();
      };

      stat("Overall Marks", `${total} / ${totalMax}`, y);
      stat("Overall Percentage", `${percent.toFixed(2)}%`, y + 30);
      stat("Overall Grade", grade, y + 60);

      // ATTENDANCE
      const ax = 340;
      const aw = 200;

      doc.font("Helvetica-Bold").fontSize(12).fillColor(BLUE)
        .text("Attendance", ax, y, { align: "center", width: aw });

      const att = (l: string, v: string, yy: number) => {
        doc.rect(ax, yy, aw, 28).stroke();
        doc.moveTo(ax + 130, yy).lineTo(ax + 130, yy + 28).stroke();

        doc.font("Helvetica-Bold").fontSize(9).fillColor(GREEN)
          .text(l, ax + 5, yy + 10);

        doc.font("Helvetica").fontSize(11).fillColor(BLACK)
          .text(v, ax + 140, yy + 10);
      };

      att("Total Working Days", data.workingDays.toString(), y + 25);
      att("Number of Days Attended", data.attendedDays.toString(), y + 53);

      const attPercent = ((data.attendedDays / data.workingDays) * 100).toFixed(2);
      att("Attendance Percentage", `${attPercent}%`, y + 81);

      y += 130;

      // FOOTER BACKGROUND
      doc.rect(0, y, PAGE_W, 200).fill(LIGHT);

      // REMARK
      doc.rect(M, y + 20, PAGE_W - 2 * M, 90).fill("#fff").stroke();

      doc.font("Helvetica-Bold").fontSize(11).fillColor(BLUE)
        .text("Teacher's Remark:", M + 10, y + 30);

      if (data.remarks) {
        doc.font("Helvetica").fontSize(11).fillColor(BLACK)
          .text(data.remarks, M + 10, y + 50, { width: 480 });
      }

      // SIGNATURES
      const lineY = y + 150;

      doc.moveTo(M, lineY).lineTo(M + 150, lineY).stroke();
      doc.moveTo(PAGE_W - M - 150, lineY).lineTo(PAGE_W - M, lineY).stroke();

      doc.font("Helvetica").fontSize(11).fillColor(BLUE);
      doc.text("Class Teacher", M, lineY + 5, { width: 150, align: "center" });
      doc.text("School Stamp", 0, lineY + 5, { width: PAGE_W, align: "center" });
      doc.text("Principal", PAGE_W - M - 150, lineY + 5, { width: 150, align: "center" });

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
};
