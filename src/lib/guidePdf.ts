import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateUserGuidePDF = (): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const PRIMARY_COLOR = "#1e3a8a"; // Deep Royal Blue
      const SECONDARY_COLOR = "#334155";
      const TEXT_COLOR = "#475569";

      // --- Title Page ---
      doc.font("Helvetica-Bold").fontSize(34).fillColor(PRIMARY_COLOR).text("Official User Manual", 0, 150, { align: "center", width: doc.page.width });
      doc.fontSize(20).fillColor(SECONDARY_COLOR).text("Global Innovative School Portal", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).fillColor(TEXT_COLOR).text("V2.0 Automated Report Generation System", { align: "center" });
      
      const logoPath = path.join(process.cwd(), "public", "gis_logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (doc.page.width - 150) / 2, doc.y + 30, { width: 150 });
      }

      // --- Table of Contents ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(22).fillColor(PRIMARY_COLOR).text("Table of Contents", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(12).fillColor(TEXT_COLOR);
      const toc = [
        "1. Overview & Purpose",
        "2. Level Selection Dashboard",
        "3. Sidebar Navigation",
        "4. Bulk CSV Processing Flow",
        "5. Manual Student Entry",
        "6. Subject & Mark Validation",
        "7. Automation & Remark Engine",
        "8. Queue Management & Editing",
        "9. Finalizing Batch Generation",
        "10. Result Archive (.ZIP)"
      ];
      toc.forEach((item, index) => {
        doc.text(`${item}`, { indent: 20 });
        doc.moveDown(0.5);
      });

      // --- Section 1: Overview ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(PRIMARY_COLOR).text("1. Overview & Purpose", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(11).fillColor(TEXT_COLOR).text(
        "The GIS Report Card Portal is a comprehensive tool built for school administrators and teachers. Its primary purpose is to transform raw academic data into professional, download-ready PDF report cards in bulk, significantly reducing manual paperwork. The v2.0 update introduces multi-level support for Pre-Primary, Primary, and Middle school branches.",
        { align: "justify" }
      );

      // --- Section 2: Level Selection Dashboard ---
      doc.moveDown(2);
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("2. Level Selection Dashboard");
      doc.font("Helvetica").fontSize(10).text("Upon entering the portal, you must select the academic level for the reports you intend to generate. This choice configures the entire portal's logic, including subjects and marks calculation.");
      doc.moveDown(0.5);
      doc.list([
        "Pre-Primary: 4 Subjects (English, Hindi, Maths, E.V.S.) - Total out of 400.",
        "Primary: 5 Subjects (Adds Computer + G.K.) - Total out of 500.",
        "Middle: 7 Subjects (Adds Social Science & Sanskrit) - Total out of 700."
      ], { bulletRadius: 2, textIndent: 15 });
      doc.moveDown(0.5);
      doc.fillColor("#991b1b").text("NOTE: Changing the level will clear your current queue to ensure data integrity.");

      // --- Section 3: Sidebar Navigation ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(PRIMARY_COLOR).text("3. Sidebar Navigation", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(10).fillColor(TEXT_COLOR).text("The sidebar is your main control panel. It houses your branding and ensures quick navigation across features.");
      const dashboardImg = path.join(process.cwd(), "public", "guide", "dashboard.png");
      if (fs.existsSync(dashboardImg)) {
        doc.image(dashboardImg, 50, doc.y + 10, { width: 450 });
        doc.moveDown(230);
      }
      doc.text("• Dashboard: The main workspace for data entry and generation.");
      doc.text("• Change Level: Returns you to the entry screen to switch between Pre-Primary, Primary, or Middle.");
      doc.text("• User Guide: Instant access to this documentation.");

      // --- Section 4: Bulk CSV Processing ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(PRIMARY_COLOR).text("4. Bulk CSV Processing Flow", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(10).text("Use this tab to upload dozens of students simultaneously using a spreadsheet.");
      const bulkImg = path.join(process.cwd(), "public", "guide", "bulk_upload.png");
      if (fs.existsSync(bulkImg)) {
        doc.image(bulkImg, 50, doc.y + 10, { width: 450 });
        doc.moveDown(230);
      }
      doc.text("Instructions:");
      doc.list([
        "Select your Level first (Pre-Primary, Primary, or Middle).",
        "Download the level-specific 'Architecture Template'.",
        "Ensure all data follows the template headers exactly (Subject columns vary by level).",
        "Drag and drop your saved .csv file into the target area.",
        "The system will automatically validate the marks and add every student to the queue below."
      ], { bulletRadius: 2, textIndent: 15 });

      // --- Section 5: Manual Student Entry ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(PRIMARY_COLOR).text("5. Manual Student Entry", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(10).text("For individual students, switch to the 'Single Manual Entry' tab.");
      const manualImg = path.join(process.cwd(), "public", "guide", "manual_entry.png");
      if (fs.existsSync(manualImg)) {
        doc.image(manualImg, 50, doc.y + 10, { width: 450 });
        doc.moveDown(230);
      }
      doc.text("Every field is validated in real-time:");
      doc.text("• DOB: Must be in DD/MM/YYYY format.");
      doc.text("• Attendance: Input 'Working Days' vs 'Attended Days'; percentage is calculated automatically.");

      // --- Section 6: Subject & Mark Validation ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("6. Subject & Mark Validation", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(10).text("Every subject, regardless of level, followed by three mark columns:");
      doc.moveDown(0.5);
      doc.list([
        "Periodic (Max 20): Monthly/Bi-monthly internal test scores.",
        "Enrichment (Max 10): Practical/Vocal evaluation scores.",
        "Term 2 (Max 80): Final examination scores."
      ], { bulletRadius: 2, textIndent: 15 });
      doc.moveDown(0.5);
      doc.fillColor("#991b1b").text("CRITICAL: The system will block entries if a score exceeds these maximum limits.");

      // --- Section 7: Automation & Remark Engine ---
      doc.moveDown(2);
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("7. Automation & Remark Engine");
      doc.moveDown();
      doc.fillColor(TEXT_COLOR).text("One of the portal's most powerful features is the 'Personalized Remark Generation'. Instead of writing long paragraphs, simply enter traits separated by commas (e.g., 'helpful, creative, hardworking').");
      doc.moveDown(0.5);
      doc.text("The AI engine will automatically craft a positive, professional, and unique remark in the second person specifically for the student.");

      // --- Section 8: Queue Management ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(PRIMARY_COLOR).text("8. Queue Management & Editing", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(10).text("After students are added (via CSV or Manual), they sit in the 'Queue Status' table at the bottom of the dashboard.");
      const queueImg = path.join(process.cwd(), "public", "guide", "queue.png");
      if (fs.existsSync(queueImg)) {
        doc.image(queueImg, 50, doc.y + 10, { width: 450 });
        doc.moveDown(230);
      }
      doc.text("• Edit: Click to pull a student back into the form for correction (The form dynamically adjusts to the current level).");
      doc.text("• Remove (X): One-click deletion of unnecessary entries.");

      // --- Section 9: Finalizing Batch Generation ---
      doc.moveDown(2);
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("9. Finalizing Batch Generation");
      doc.moveDown();
      const confirmImg = path.join(process.cwd(), "public", "guide", "confirmation.png");
      if (fs.existsSync(confirmImg)) {
        doc.image(confirmImg, 50, doc.y, { width: 450 });
        doc.moveDown(150);
      }
      doc.text("When hitting the 'Initiate Generation' button, an orange confirmation wall will appear to verify you are ready to process all students.");

      // --- Section 10: Result Archive (.ZIP) ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(PRIMARY_COLOR).text("10. Result Archive (.ZIP)", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(10).text("Once processing is complete, the portal generates a single Result ZIP archive for your institution.");
      const successImg = path.join(process.cwd(), "public", "guide", "success.png");
      if (fs.existsSync(successImg)) {
        doc.image(successImg, 50, doc.y + 10, { width: 450 });
        doc.moveDown(230);
      }
      doc.text("Inside the ZIP file provided:");
      doc.text("• 1 PDF for each student (Individual report cards).");
      doc.text("• 1 'Class Feedback Form' (Master landscape-mode document listing everyone).");

      // --- Footer ---
      doc.font("Helvetica").fontSize(8).fillColor("#94a3b8").text("© 2026 Global Innovative School - Portal Usage Guide - Confidential", 50, doc.page.height - 40, { align: "center" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};
