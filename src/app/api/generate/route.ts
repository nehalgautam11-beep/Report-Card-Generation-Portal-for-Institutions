import { NextRequest, NextResponse } from "next/server";
import { generateRemarks } from "@/lib/remarks";
import { generateReportCardPDF, StudentData } from "@/lib/pdfGenerator";
import { generateFeedbackFormPDF } from "@/lib/feedbackPdf";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

// Increase timeout for serverless function on Vercel
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { students } = await req.json() as { students: StudentData[] };

    if (!students || students.length === 0) {
      return NextResponse.json({ error: "No student data provided" }, { status: 400 });
    }

    // Pre-load logo buffer ONCE to avoid repeated disk reads (Significant performance boost)
    let logoBuffer: Buffer | undefined;
    const logoPath = path.join(process.cwd(), "public", "gis_logo.png");
    if (fs.existsSync(logoPath)) {
      try {
        logoBuffer = fs.readFileSync(logoPath);
      } catch (e) {
        console.error("Failed to pre-load logo:", e);
      }
    }

    const zip = new AdmZip();

    // Process students in chunks of 5 (Optimal balance between speed and memory)
    const chunkSize = 5;
    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);
      
      await Promise.all(chunk.map(async (student) => {
        // 1. Generate Remark
        let remark = student.remarks;
        if (!remark && student.qualities) {
          remark = await generateRemarks(student.qualities, student.name);
        }
        student.remarks = remark || "Excellent performance and behavior. Keep up the good work!";

        // 2. Generate PDF using pre-loaded buffer
        const pdfBuffer = await generateReportCardPDF(student, logoBuffer);

        // 3. Add to ZIP
        const filename = `${student.name.replace(/\s+/g, '_')}_ReportCard.pdf`;
        zip.addFile(filename, pdfBuffer);
      }));
    }

    // 4. Generate the collective Feedback Form PDF (Now using logo buffer for ultimate speed)
    const feedbackPdfBuffer = await generateFeedbackFormPDF(students, logoBuffer);
    zip.addFile("Class_Feedback_Form.pdf", feedbackPdfBuffer);

    // 5. Generate final zip buffer
    const zipBuffer = zip.toBuffer();

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="report_cards_${Date.now()}.zip"`,
      },
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate report cards" }, { status: 500 });
  }
}
