import PDFDocument from "pdfkit";

export const generateUserGuidePDF = (): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 60 });
      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const PRIMARY_COLOR = "#f97316";
      const SECONDARY_COLOR = "#1e293b";
      const ACCENT_COLOR = "#334155";
      const TEXT_COLOR = "#475569";

      // --- Header / Branding ---
      doc.font("Helvetica-Bold").fontSize(26).fillColor(PRIMARY_COLOR).text("GIS REPORT CARD PORTAL", { align: "center" });
      doc.fontSize(14).fillColor(SECONDARY_COLOR).text("Official Operational Manual & Feature Guide", { align: "center" });
      doc.moveDown(0.5);
      doc.moveTo(100, doc.y).lineTo(doc.page.width - 100, doc.y).strokeColor("#cbd5e1").lineWidth(1).stroke();
      doc.moveDown(2);

      // --- Section 1: Overview ---
      doc.font("Helvetica-Bold").fontSize(16).fillColor(ACCENT_COLOR).text("1. System Overview");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(TEXT_COLOR).text(
        "The GIS Report Card Portal version 2.0 is a robust, automated platform designed for educational institutions to streamline the generation of academic results. The system prioritizes data privacy, professional aesthetics, and intelligent remark generation.",
        { align: "justify" }
      );
      doc.moveDown();

      // --- Section 2: Getting Started ---
      doc.font("Helvetica-Bold").fontSize(16).fillColor(ACCENT_COLOR).text("2. Getting Started");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(TEXT_COLOR).text(
        "Upon launching the portal, you will be greeted by the central Dashboard. The interface is divided into two primary functions: Bulk CSV Upload and Single Manual Entry."
      );
      doc.moveDown();

      // --- Section 3: Bulk Data Processing ---
      doc.font("Helvetica-Bold").fontSize(14).fillColor(SECONDARY_COLOR).text("3. Bulk CSV Upload");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(TEXT_COLOR).text(
        "For processing entire classrooms or grades simultaneously, the Bulk Upload feature is the most efficient method."
      );
      doc.moveDown(0.5);
      doc.list([
        "Download the Architecture Template: Use the provided link to ensure your spreadsheet columns match the system requirements exactly.",
        "Prepare Data: Ensure all marks are within valid ranges (Periodic: 20, Enrichment: 10, Term 2: 80).",
        "Upload: Drag and drop your .csv file into the upload zone. The system will automatically parse and validate every student profile."
      ], { bulletRadius: 2, textIndent: 15 });
      doc.moveDown();

      // --- Section 4: Manual Entry Workflow ---
      doc.font("Helvetica-Bold").fontSize(14).fillColor(SECONDARY_COLOR).text("4. Single Manual Entry");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(TEXT_COLOR).text(
        "For ad-hoc reports or individual corrections, use the Manual Entry form. This is a multi-step process:"
      );
      doc.moveDown(0.5);
      doc.list([
        "Student Profile: Input basic biographical data. Date of Birth must follow the DD/MM/YYYY format.",
        "Attendance Tracking: Input 'Working Days' and 'Days Attended'. The system automatically calculates the attendance percentage for the final report.",
        "Academic Metrics: Enter marks for core subjects. Real-time validation prevents saving if scores exceed the predefined thresholds.",
        "Remark Engine: Enter descriptive qualities (e.g., 'creative, hardworking'). The internal engine will craft a professional, positive, second-person remark for the student."
      ], { bulletRadius: 2, textIndent: 15 });
      doc.moveDown();

      // --- Section 5: Queue Management ---
      doc.font("Helvetica-Bold").fontSize(16).fillColor(ACCENT_COLOR).text("5. Queue & Validation");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(TEXT_COLOR).text(
        "Before generating any files, all students are visible in the 'Queue Status' table. This acts as a staging area where you can:"
      );
      doc.moveDown(0.5);
      doc.list([
        "Review Data: Check names and classes for typos.",
        "Edit: Clicking 'Edit' will remove the student from the queue and populate their details back into the manual form for quick adjustments.",
        "Remove: Delete any unwanted entries before the batch process starts."
      ], { bulletRadius: 2, textIndent: 15 });
      doc.moveDown();

      // --- Section 6: Generation & Output ---
      doc.font("Helvetica-Bold").fontSize(16).fillColor(ACCENT_COLOR).text("6. Generation & Output");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(TEXT_COLOR).text(
        "Once the queue is finalized, initiating the 'Generation Sequence' will produce a single ZIP archive. This archive contains:"
      );
      doc.moveDown(0.5);
      doc.list([
        "Individual Report Cards: High-definition PDFs for every student in the queue, featuring the school logo and balanced branding.",
        "Class Feedback Form: A master landscape-mode document listing all students, designed for manual feedback or administrative signatures."
      ], { bulletRadius: 2, textIndent: 15 });
      doc.moveDown(2);

      // --- Safety Warning ---
      doc.rect(doc.x, doc.y, doc.page.width - 120, 45).fill("#fff7ed");
      doc.fillColor("#9a3412").font("Helvetica-Bold").text("Important Safety Note:", doc.x + 10, doc.y + 10);
      doc.font("Helvetica").fontSize(10).text("Refreshing the browser will clear the local queue. Always complete your generation sequence before leaving the page.", doc.x, doc.y + 2);
      
      // --- Footer ---
      const footerY = doc.page.height - 50;
      doc.font("Helvetica").fontSize(8).fillColor("#94a3b8").text("© 2026 Global Innovative School - Official Documentation", 60, footerY, { align: "center" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};
