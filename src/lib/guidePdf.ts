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

      const PRIMARY_COLOR = "#f97316";
      const SECONDARY_COLOR = "#334155";
      const TEXT_COLOR = "#475569";

      // --- Title Page ---
      doc.font("Helvetica-Bold").fontSize(34).fillColor(PRIMARY_COLOR).text("Official User Manual", { align: "center", y: 150 });
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
        "2. Sidebar Navigation",
        "3. Bulk CSV Processing Flow",
        "4. Manual Student Entry",
        "5. Subject & Mark Validation",
        "6. Automation & Remark Engine",
        "7. Queue Management & Editing",
        "8. Finalizing Batch Generation",
        "9. Result Archive (.ZIP)",
        "10. Data Safety & Protection"
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
        "The GIS Report Card Portal is a comprehensive tool built for school administrators and teachers. Its primary purpose is to transform raw academic data into professional, download-ready PDF report cards in bulk, significantly reducing manual paperwork.",
        { align: "justify" }
      );

      // --- Section 2: Sidebar Navigation ---
      doc.moveDown(2);
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("2. Sidebar Navigation");
      doc.font("Helvetica").fontSize(10).text("The sidebar is your main control panel. It houses your branding and ensures quick navigation across features.");
      const dashboardImg = path.join(process.cwd(), "public", "guide", "dashboard.png");
      if (fs.existsSync(dashboardImg)) {
        doc.image(dashboardImg, 50, doc.y + 10, { width: 450 });
        doc.moveDown(230);
      }
      doc.text("• Dashboard: The main workspace for data entry and generation.");
      doc.text("• User Guide: Instant access to this documentation.");
      doc.text("• Settings & Archive: Future modules for result storage and configuration.");

      // --- Section 3: Bulk CSV Processing ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(PRIMARY_COLOR).text("3. Bulk CSV Processing Flow", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(10).text("Use this tab to upload dozens of students simultaneously using a spreadsheet.");
      const bulkImg = path.join(process.cwd(), "public", "guide", "bulk_upload.png");
      if (fs.existsSync(bulkImg)) {
        doc.image(bulkImg, 50, doc.y + 10, { width: 450 });
        doc.moveDown(230);
      }
      doc.text("Instructions:");
      doc.list([
        "Click the link to download the 'Architecture Template'.",
        "Ensure all data follows the template headers exactly.",
        "Drag and drop your saved .csv file into the target area.",
        "The system will automatically validate the marks and add every student to the queue below."
      ], { bulletRadius: 2, textIndent: 15 });

      // --- Section 4: Manual Student Entry ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(PRIMARY_COLOR).text("4. Manual Student Entry", 50, 50);
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

      // --- Section 5: Subject & Mark Validation ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("5. Subject & Mark Validation", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(10).text("The system supports 5 core subjects: English, Hindi, Maths, EVS, and Computer. Every subject has three mark columns:");
      doc.moveDown(0.5);
      doc.list([
        "Periodic (Max 20): Monthly/Bi-monthly internal test scores.",
        "Enrichment (Max 10): Practical/Vocal evaluation scores.",
        "Term 2 (Max 80): Final examination scores."
      ], { bulletRadius: 2, textIndent: 15 });
      doc.moveDown(0.5);
      doc.fillColor("#991b1b").text("CRITICAL: The system will block entries if a score exceeds these maximum limits.");

      // --- Section 6: Automation & Remark Engine ---
      doc.moveDown(2);
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("6. Automation & Remark Engine");
      doc.moveDown();
      doc.fillColor(TEXT_COLOR).text("One of the portal's most powerful features is the 'Personalized Remark Generation'. Instead of writing long paragraphs, simply enter traits separated by commas (e.g., 'helpful, creative, hardworking').");
      doc.moveDown(0.5);
      doc.text("The AI engine will automatically craft a positive, professional, and unique remark in the second person specifically for the student.");

      // --- Section 7: Queue Management ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(PRIMARY_COLOR).text("7. Queue Management & Editing", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(10).text("After students are added (via CSV or Manual), they sit in the 'Queue Status' table at the bottom of the dashboard.");
      const queueImg = path.join(process.cwd(), "public", "guide", "queue.png");
      if (fs.existsSync(queueImg)) {
        doc.image(queueImg, 50, doc.y + 10, { width: 450 });
        doc.moveDown(230);
      }
      doc.text("• Edit: Click to pull a student back into the form for correction.");
      doc.text("• Remove: One-click deletion of unnecessary entries.");

      // --- Section 8: Finalizing Batch Generation ---
      doc.moveDown(2);
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("8. Finalizing Batch Generation");
      doc.moveDown();
      const confirmImg = path.join(process.cwd(), "public", "guide", "confirmation.png");
      if (fs.existsSync(confirmImg)) {
        doc.image(confirmImg, 50, doc.y, { width: 450 });
        doc.moveDown(150);
      }
      doc.text("When hitting the 'Initiate Generation' button, an orange confirmation wall will appear to verify you are ready to process all students.");

      // --- Section 9: Result Archive (.ZIP) ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(PRIMARY_COLOR).text("9. Result Archive (.ZIP)", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(10).text("Once processing is complete, the portal generates a single Result ZIP archive for your institution.");
      const successImg = path.join(process.cwd(), "public", "guide", "success.png");
      if (fs.existsSync(successImg)) {
        doc.image(successImg, 50, doc.y + 10, { width: 450 });
        doc.moveDown(230);
      }
      doc.text("Inside the ZIP file provided:");
      doc.text("• 1 PDF for each student (Professional individual report cards).");
      doc.text("• 1 'Class Feedback Form' (Master landscape-mode document listing everyone).");

      // --- Section 10: Data Safety & Protection ---
      doc.moveDown(2);
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("10. Data Safety & Protection");
      doc.font("Helvetica").fontSize(10).text("To avoid accidental data loss, the portal includes an 'Unsaved Changes' detection system. If you attempt to refresh or close your browser tab while students are in the queue, a warning prompt will block the action, protecting your session state.");

      // --- Footer ---
      doc.font("Helvetica").fontSize(8).fillColor("#94a3b8").text("© 2026 Global Innovative School - Portal Usage Guide - Confidential", 50, doc.page.height - 40, { align: "center" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};
