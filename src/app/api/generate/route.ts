import { NextRequest, NextResponse } from "next/server";
import { generateRemarks } from "@/lib/remarks";
import { generateReportCardPDF, StudentData } from "@/lib/pdfGenerator";
import { generateFeedbackFormPDF } from "@/lib/feedbackPdf";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

// Increase timeout for serverless function on Vercel
export const maxDuration = 60;

interface StudentPayload extends StudentData {
  qualities?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { students } = await req.json() as { students: StudentPayload[] };

    if (!students || students.length === 0) {
      return NextResponse.json({ error: "No student data provided" }, { status: 400 });
    }

    // Pre-load logo buffer ONCE
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

    // Process students SEQUENTIALLY (1000% safe memory and zero race conditions)
    console.log(`Starting generation for ${students.length} students...`);
    for (const student of students) {
      // 1. Generate Remark
      let remark = student.remarks;
      if (!remark && student.qualities) {
        remark = await generateRemarks(student.qualities, student.name);
      }
      student.remarks = remark || "Excellent performance and behavior. Keep up the good work!";

      // 2. Generate PDF
      const pdfBuffer = await generateReportCardPDF(student, logoBuffer);

      // 3. Add to ZIP
      const filename = `${student.name.replace(/\s+/g, '_')}_ReportCard.pdf`;
      zip.addFile(filename, pdfBuffer);
    }

    // 4. Generate the collective Feedback Form PDF
    const feedbackPdfBuffer = await generateFeedbackFormPDF(students, logoBuffer);
    zip.addFile("Class_Feedback_Form.pdf", feedbackPdfBuffer);

    // 5. Generate final zip buffer and convert to safe TypedArray
    const zipBuffer = zip.toBuffer();
    const finalUint8Array = new Uint8Array(zipBuffer);

    console.log("Generation complete. Sending ZIP...");
    return new NextResponse(finalUint8Array, {
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
