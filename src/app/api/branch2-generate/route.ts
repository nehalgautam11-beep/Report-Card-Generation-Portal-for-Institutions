import { NextRequest, NextResponse } from "next/server";
import { generateRemarks } from "@/lib/remarks";
import { generateBranch2ReportCardPDF, type ReportLevel, type StudentData } from "@/lib/branch2PdfGenerator";
import { generateFeedbackFormPDF } from "@/lib/feedbackPdf";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

export const maxDuration = 60;

interface StudentPayload extends StudentData {
  qualities?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { students, reportLevel } = await req.json() as {
      students: StudentPayload[];
      reportLevel?: ReportLevel;
    };

    if (!students || students.length === 0) {
      return NextResponse.json({ error: "No student data provided" }, { status: 400 });
    }

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

    console.log(`Starting Branch 2 generation for ${students.length} students...`);
    for (const student of students) {
      let remark = student.remarks;
      if (!remark && student.qualities) {
        remark = await generateRemarks(student.qualities, student.name);
      }
      student.remarks = remark || "Excellent performance and behavior. Keep up the good work!";

      const pdfBuffer = await generateBranch2ReportCardPDF(student, logoBuffer, reportLevel);

      const filename = `${student.name.replace(/\s+/g, '_')}_Branch2_ReportCard.pdf`;
      zip.addFile(filename, pdfBuffer);
    }

    const feedbackPdfBuffer = await generateFeedbackFormPDF(students, logoBuffer);
    zip.addFile("Class_Feedback_Form.pdf", feedbackPdfBuffer);

    const zipBuffer = zip.toBuffer();
    const finalUint8Array = new Uint8Array(zipBuffer);

    return new NextResponse(finalUint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="gis_branch2_report_cards_${Date.now()}.zip"`,
      },
    });

  } catch (error) {
    console.error("Branch 2 API Error:", error);
    return NextResponse.json({ error: "Failed to generate Branch 2 report cards" }, { status: 500 });
  }
}
