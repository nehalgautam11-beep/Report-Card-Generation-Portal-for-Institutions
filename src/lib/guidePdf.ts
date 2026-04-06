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
      doc.font("Helvetica-Bold").fontSize(32).fillColor(PRIMARY_COLOR).text("Official User Guide", { align: "center", y: 200 });
      doc.fontSize(18).fillColor(SECONDARY_COLOR).text("GIS Report Card Generation Portal v2.0", { align: "center" });
      doc.moveDown();
      
      const logoPath = path.join(process.cwd(), "public", "gis_logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (doc.page.width - 120) / 2, doc.y + 20, { width: 120 });
      }

      // --- Introduction ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(22).fillColor(PRIMARY_COLOR).text("1. Introduction", 50, 50);
      doc.moveDown();
      doc.font("Helvetica").fontSize(11).fillColor(TEXT_COLOR).text(
        "Welcome to the GIS Report Card Portal. This system automates the generation of academic reports with 100% reliability and professional school branding.",
        { align: "justify" }
      );

      // --- Dashboard Overview ---
      doc.moveDown(2);
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("2. The Dashboard Overview");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10).text("The main interface features a responsive sidebar for navigation and a primary workspace area.");
      
      const dashboardImg = path.join(process.cwd(), "public", "guide", "dashboard.png");
      if (fs.existsSync(dashboardImg)) {
        doc.image(dashboardImg, 50, doc.y + 10, { width: 480 });
        doc.moveDown(220); // Space for image
      }

      // --- Bulk Upload ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("3. Bulk CSV Upload Feature");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10).text("Process entire classes instantly by uploading a spreadsheet. Download the template to ensure your headers match.");
      
      const bulkImg = path.join(process.cwd(), "public", "guide", "bulk_upload.png");
      if (fs.existsSync(bulkImg)) {
        doc.image(bulkImg, 50, doc.y + 10, { width: 480 });
        doc.moveDown(220);
      }

      // --- Manual Entry ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("4. Single Manual Entry Workflow");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10).text("Enter data for individual students. Includes real-time validation of DOB and marks.");
      
      const manualImg = path.join(process.cwd(), "public", "guide", "manual_entry.png");
      if (fs.existsSync(manualImg)) {
        doc.image(manualImg, 50, doc.y + 10, { width: 480 });
        doc.moveDown(220);
      }

      // --- Student Queue ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("5. Student Queue & Monitoring");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10).text("See exactly who is ready for generation. Edit or Remove students directly from the dashboard table.");
      
      const queueImg = path.join(process.cwd(), "public", "guide", "queue.png");
      if (fs.existsSync(queueImg)) {
        doc.image(queueImg, 50, doc.y + 10, { width: 480 });
        doc.moveDown(220);
      }

      // --- Final Generation ---
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("6. Generation Confirmation");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10).text("A safety wall prevents accidental generation. Confirming triggers the AI Render Engine and PDF creation.");
      
      const confirmImg = path.join(process.cwd(), "public", "guide", "confirmation.png");
      if (fs.existsSync(confirmImg)) {
        doc.image(confirmImg, 50, doc.y + 10, { width: 480 });
        doc.moveDown(150);
      }

      // --- Success Screen ---
      doc.moveDown(2);
      doc.font("Helvetica-Bold").fontSize(18).fillColor(SECONDARY_COLOR).text("7. Success & Result Archive");
      doc.font("Helvetica").fontSize(10).text("Download a ZIP archive containing all individual report cards plus the consolidated class feedback form.");
      
      const succesImg = path.join(process.cwd(), "public", "guide", "success.png");
      if (fs.existsSync(succesImg)) {
        doc.moveDown(10);
        doc.image(succesImg, 50, doc.y, { width: 480 });
      }

      // --- Footer ---
      doc.font("Helvetica").fontSize(8).fillColor("#94a3b8").text("© 2026 Global Innovative School - Portal Usage Guide", 50, doc.page.height - 40, { align: "center" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};
